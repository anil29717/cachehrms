# Fix "permission denied for sequence ..._id_seq"

When tables are created by the **postgres** user but the app runs as **hrms_user**, inserts fail because `hrms_user` has no permission on the sequences.

**One-time fix:** Run the following as a PostgreSQL **superuser** (e.g. `postgres`) against the database **cachedigitech_hrms**.

### Option 1: Using psql

```bash
cd backend
psql -U postgres -h 172.16.110.46 -d cachedigitech_hrms -f prisma/grant-sequences.sql
```

(Change `-h` / `-U` if your postgres user or host differ.)

### Option 2: Copy-paste in pgAdmin / DBeaver

Open `prisma/grant-sequences.sql`, connect as **postgres** to **cachedigitech_hrms**, and execute it.

### What it does

- Grants `USAGE`, `SELECT`, and `UPDATE` on all sequences in `public` to `hrms_user`.
- After this, creating departments (and any other insert that uses a sequence) will work when the app uses `hrms_user`.
