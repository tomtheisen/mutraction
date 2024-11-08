using Microsoft.Data.Sqlite;

/*
 * Minimal migrations:
 *  - To create a new migration step, append items to `Commands`.  Never remove one.
 *  - Schema version is determined by count of commands. Current schema version is stored in table `schema`.
 *  - When `EnsureDb()` runs, any new migration commands will be invoked.  Then the stored schema is updated.
 */

public static class Migrations {
    private static string[] Commands =
    {
        """
        CREATE TABLE IF NOT EXISTS link (
            id TEXT PRIMARY KEY,
            href TEXT NOT NULL
        );
        """,
        """
        ALTER TABLE link ADD COLUMN created TEXT
        """,
        """
        ALTER TABLE link ADD COLUMN accessed TEXT
        """,
        """
        ALTER TABLE link ADD COLUMN hits INTEGER
        """,
        """
        UPDATE link SET hits = 0 WHERE hits IS NULL
        """,
    };

    public static void EnsureDb() {
        var connection = new SqliteConnection("Data Source=links.db");
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = "CREATE TABLE IF NOT EXISTS schema (version INTEGER);";
        command.ExecuteNonQuery();

        command.CommandText = "SELECT MAX(version) FROM schema";
        int version = command.ExecuteScalar() switch
        {
            DBNull or null => 0,
            object o => Convert.ToInt32(o),
        };

        foreach (var cmd in Commands.Skip(version))
        {
            command.CommandText = cmd;
            command.ExecuteNonQuery();
        }

        command.CommandText = "DELETE FROM schema";
        command.ExecuteNonQuery();

        command.CommandText = $"INSERT INTO schema (version) VALUES({ Commands.Length })";
        command.ExecuteNonQuery();
    }
}
