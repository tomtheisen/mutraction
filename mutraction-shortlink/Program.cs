using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using System.Text;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors();

var app = builder.Build();
app.UseCors();
// app.UseHttpsRedirection();

SqliteConnection GetConnection()
{
    var connection = new SqliteConnection("Data Source=links.db");
    connection.Open();
    return connection;
}

void EnsureDb()
{
    using var connection = GetConnection();
    using var command = connection.CreateCommand();
    command.CommandText =
        """
        CREATE TABLE IF NOT EXISTS link (
            id TEXT PRIMARY KEY,
            href TEXT NOT NULL
        );
        """;
    command.ExecuteNonQuery();
}

EnsureDb();

string HashLink(string href) {
    const string Symbols = "abcdefghjkmnpqrstuvwxyz023456789";

    var bytes = Encoding.UTF8.GetBytes(href);
    var sha256 = SHA256.HashData(bytes);
    var hashChars = new char[24];
    for (int i = 0; i < hashChars.Length; i++)
    {
        hashChars[i] = Symbols[bytes[i] % Symbols.Length];
    }
    return new string(hashChars);
}

app.MapPost("/link", ([FromBody] Link link) =>
{
    var href = link.href;
    if (href is null || !href.StartsWith("https://mutraction.dev/")) return Results.StatusCode(400);

    var id = HashLink(href);

    using var connection = GetConnection();
    using var command = connection.CreateCommand();
    command.CommandText = "INSERT OR IGNORE INTO link (id, href) VALUES($id, $href)";
    command.Parameters.AddWithValue("$id", id);
    command.Parameters.AddWithValue("$href", href);

    return Results.Ok(new { id });
});

app.MapGet("/link/{id}", (string id) =>
{
    using var connection = GetConnection();
    using var command = connection.CreateCommand();
    command.CommandText = "SELECT href FROM link WHERE id = $id";
    command.Parameters.AddWithValue("$id", id);
    using var reader = command.ExecuteReader();

    string? href = null;
    while (reader.Read()) href = reader.GetString(0);
    if (href is null) return Results.NotFound($"No link for '{ id }'");

    return Results.Redirect(href, permanent: true);
});

app.MapGet("/", () =>
{
    return "mutraction sandbox link shortener";
});

app.Run();

record Link(string href);
