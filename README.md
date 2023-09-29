# Zimbra Migration Tools

## Overview

The **zimbra-migration-tools** project is a set of tools designed to facilitate the migration of accounts in a Zimbra environment. It provides a seamless way to export and import accounts, giving administrators the flexibility to manage user accounts efficiently.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/zimbra-migration-tools.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Configuration

Configure the migration tools by editing the `src/config.ts` file.

### `config.ts`

This file contains an export and import object for server configuration. Modify the settings accordingly:

```typescript
// src/config.ts

const config = {
  import: {
    url: "https://zimbra-import.com:7071/service/admin/soap/",
    username: "admin",
    password: "Password",
  },
  export: {
    url: "https://zimbra-export:7071/service/admin/soap/",
    username: "admin",
    password: "Password",
  },
};
```

## Usage

Run the migration tools with the following command:

```bash
npm start
```

### Options

- **Export**: Exports accounts from the Zimbra server.

- **Import**: Imports accounts into the Zimbra server.

  - **Create Account**: Import accounts by creating new ones.

  - **Modify Account**: Import accounts by modifying existing ones.

    - Sub-choices to select attributes to import.

## Example

```bash
npm start

? Select operation: (Use arrow keys)
❯ Export
  Import

? Select import operation: (Use arrow keys)
❯ Create Account
  Modify Account

? Select attributes to import: (Press <space> to select, <a> to toggle all, <i> to invert selection)
❯◉ Email
 ◯ Password
 ◉ Display Name
 ◉ Quota
 ◉ ... (other attributes)

```

Choose the appropriate options based on your migration requirements.
