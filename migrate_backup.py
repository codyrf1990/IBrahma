#!/usr/bin/env python3
"""
Migration script to convert legacy backup file from HTML format to new structured format.
Uses only Python standard library (no external dependencies).
"""

import json
import re
from datetime import datetime


def parse_date(date_str):
    """
    Convert date from M/D/YYYY format to YYYY-MM-DD format.

    Args:
        date_str: Date string in M/D/YYYY format (e.g., "1/7/2025")

    Returns:
        Date string in YYYY-MM-DD format (e.g., "2025-01-07")
    """
    try:
        # Parse M/D/YYYY format
        date_obj = datetime.strptime(date_str, "%m/%d/%Y")
        # Return in YYYY-MM-DD format
        return date_obj.strftime("%Y-%m-%d")
    except ValueError:
        print(f"Warning: Could not parse date '{date_str}'")
        return ""


def parse_amount(amount_str):
    """
    Convert amount from "USD X,XXX.XX" format to number.

    Args:
        amount_str: Amount string like "USD 3,366.00"

    Returns:
        Numeric amount (e.g., 3366)
    """
    try:
        # Remove "USD " prefix and commas, then convert to float and int
        cleaned = amount_str.replace("USD ", "").replace(",", "")
        return int(float(cleaned))
    except (ValueError, AttributeError):
        print(f"Warning: Could not parse amount '{amount_str}'")
        return 0


def extract_text_from_div(html, class_name):
    """
    Extract text content from a div with specific class using regex.

    Args:
        html: HTML string to search
        class_name: CSS class name to find

    Returns:
        Text content of the div, or empty string if not found
    """
    pattern = rf'<div class="{class_name}">([^<]+)</div>'
    match = re.search(pattern, html)
    return match.group(1).strip() if match else ""


def extract_client_from_html(row_html, index):
    """
    Extract client data from a client-row HTML string.

    Args:
        row_html: HTML string for one client row
        index: Index for generating unique ID

    Returns:
        Dictionary with client data in new format
    """
    # Extract data using regex
    name = extract_text_from_div(row_html, 'client-name')
    close_date_raw = extract_text_from_div(row_html, 'client-date')
    renewal_date_raw = extract_text_from_div(row_html, 'client-renewal-date')
    amount_raw = extract_text_from_div(row_html, 'client-amount')
    opp_id = extract_text_from_div(row_html, 'client-id')

    # Convert dates and amount
    close_date = parse_date(close_date_raw)
    renewal_date = parse_date(renewal_date_raw)
    amount = parse_amount(amount_raw)

    # Check if row is checked
    is_checked = 'class="client-row checked"' in row_html

    # Generate unique ID using timestamp and index
    timestamp = int(datetime.now().timestamp() * 1000)
    unique_id = f"client-{timestamp}-{index}"

    return {
        "id": unique_id,
        "name": name,
        "renewalDate": renewal_date,
        "sentDate": "",  # Not in old format
        "closeDate": close_date,
        "amount": amount,
        "opportunityId": opp_id,
        "isChecked": is_checked,
        "notes": ""
    }


def migrate_backup(input_file, output_file):
    """
    Migrate backup file from old HTML format to new structured format.

    Args:
        input_file: Path to old backup file
        output_file: Path for new converted file
    """
    print(f"Loading backup file: {input_file}")

    # Load old backup file
    with open(input_file, 'r', encoding='utf-8') as f:
        old_data = json.load(f)

    print(f"Found {len(old_data.get('sections', []))} sections")

    # Extract clients from all sections
    clients = []
    client_index = 0

    for section in old_data.get('sections', []):
        month = section.get('month', 'unknown')
        html = section.get('html', '')

        # Split HTML by finding each <div class="client-row"...> and capturing until the matching </div>
        # We need to handle nested divs properly
        rows = []
        pos = 0
        while True:
            # Find next client-row div
            start = html.find('<div class="client-row', pos)
            if start == -1:
                break

            # Find the end of the opening tag
            tag_end = html.find('>', start)
            if tag_end == -1:
                break

            # Count nested divs to find the matching closing tag
            depth = 1
            search_pos = tag_end + 1
            while depth > 0 and search_pos < len(html):
                next_open = html.find('<div', search_pos)
                next_close = html.find('</div>', search_pos)

                if next_close == -1:
                    break

                if next_open != -1 and next_open < next_close:
                    depth += 1
                    search_pos = next_open + 4
                else:
                    depth -= 1
                    if depth == 0:
                        # Found matching close tag
                        end = next_close + 6  # Include </div>
                        rows.append(html[start:end])
                        pos = end
                        break
                    search_pos = next_close + 6

            if depth > 0:
                # Couldn't find matching close tag, skip this one
                pos = tag_end + 1

        print(f"Processing {month}: found {len(rows)} clients")

        for row_html in rows:
            client = extract_client_from_html(row_html, client_index)
            clients.append(client)
            client_index += 1

    print(f"\nTotal clients extracted: {len(clients)}")

    # Discover years from close dates
    years_set = set()
    for client in clients:
        if client['closeDate'] and len(client['closeDate']) >= 4:
            year = int(client['closeDate'][:4])
            years_set.add(year)

    available_years = sorted(list(years_set))
    active_year = max(available_years) if available_years else datetime.now().year

    print(f"Discovered years: {available_years}")
    print(f"Active year: {active_year}")

    # Build checked rows array from client IDs
    checked_rows = [client['id'] for client in clients if client['isChecked']]

    print(f"Checked clients: {len(checked_rows)}")

    # Build new data structure
    new_data = {
        "clients": clients,
        "receiptsGoal": 55,
        "checkedRows": checked_rows,
        "searchTerm": "",
        "activeYear": active_year,
        "availableYears": available_years
    }

    # Save converted file
    print(f"\nSaving converted file: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2)

    print("✓ Migration complete!")
    print(f"  - {len(clients)} clients converted")
    print(f"  - {len(checked_rows)} checked rows")
    print(f"  - {len(available_years)} years: {available_years}")


if __name__ == "__main__":
    input_file = "Darryl's Sub Tracker (Backup) 2.json"
    output_file = "Darryl's Sub Tracker (Converted).json"

    migrate_backup(input_file, output_file)
