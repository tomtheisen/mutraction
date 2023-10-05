using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using System.Text;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder => builder
        .AllowAnyHeader()
        .AllowAnyOrigin()
        .AllowAnyMethod());
});

var app = builder.Build();
app.UseCors();

SqliteConnection GetConnection()
{
    var connection = new SqliteConnection("Data Source=links.db");
    connection.Open();
    return connection;
}

Migrations.EnsureDb();

string HashLink(string href) {
    const string Symbols = "abcdefghjkmnpqrstuvwxyz023456789";

    var bytes = Encoding.UTF8.GetBytes(href);
    var sha256 = SHA256.HashData(bytes);
    var hashChars = new char[24];
    for (int i = 0; i < hashChars.Length; i++)
    {
        hashChars[i] = Symbols[sha256[i] % Symbols.Length];
    }
    return new string(hashChars);
}

string[] Prefixes(string s)
{
    var result = new string[s.Length];
    for (int i = 0; i < s.Length; i++)
    {
        result[i] = s[..(i+1)];
    }
    return result;
}

app.MapPost("/link", ([FromBody] Link link) =>
{
    var href = link.href;
    string? id = null;
    if (href is null || !href.StartsWith("https://mutraction.dev/")) return Results.BadRequest("This is for mutraction sandbox stuff, not whatever that is.");

    var hash = HashLink(href);
    var prefixes = Prefixes(hash);
    var inClause = string.Join(", ", prefixes.Select(p => $"'{ p }'"));

    using var connection = GetConnection();
    using var command = connection.CreateCommand();
    command.CommandText = $"SELECT id, href FROM link WHERE id IN ({ inClause }) ORDER BY length(id)";

    int maxLenUsed = 0;
    using (var reader = command.ExecuteReader())
    {
        while (reader.Read())
        {
            if (reader.GetString(1) == href)
            {
                id ??= reader.GetString(0);
            }
            else
            {
                maxLenUsed = Math.Max(maxLenUsed, reader.GetString(0).Length);
            }
        }
    }

    if (id is null)
    {
        id = hash[..(maxLenUsed + 1)];
        command.CommandText = "INSERT INTO link (id, href, created, hits) VALUES($id, $href, date(), 0)";
        command.Parameters.AddWithValue("$id", id);
        command.Parameters.AddWithValue("$href", href);
        command.ExecuteNonQuery();
    }
    else
    {
        command.CommandText = "UPDATE link SET hits = hits + 1, accessed = date() WHERE id = $id";
        command.Parameters.AddWithValue("$id", id);
        command.ExecuteNonQuery();
    }

    return Results.Ok(new { id });
});

app.MapGet("/links", () =>
{
    using var connection = GetConnection();
    using var command = connection.CreateCommand();
    command.CommandText = "SELECT id, created, hits, accessed FROM link";
    using var reader = command.ExecuteReader();

    List<object> links = new();
    while (reader.Read()) {
        var link = new { 
            id = reader.GetString(0), 
            created = reader.IsDBNull(1) ? default(DateTime?) : reader.GetDateTime(1), 
            hits = reader.GetInt32(2),
            accessed = reader.IsDBNull(3) ? default(DateTime?) : reader.GetDateTime(3),
        };
        links.Add(link);
    }

    return Results.Ok(links);
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
