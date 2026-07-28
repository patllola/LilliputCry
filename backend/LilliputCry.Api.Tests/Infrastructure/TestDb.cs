using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TinyTrack.Api.Data;

namespace LilliputCry.Api.Tests.Infrastructure;

/// <summary>
/// A real relational database per test, backed by SQLite in memory.
///
/// SQLite rather than the EF in-memory provider because the services under test rely on
/// relational behaviour the in-memory provider fakes or refuses: unique indexes,
/// foreign keys, and <c>ExecuteDeleteAsync</c>.
///
/// The connection is held open for the fixture's lifetime — an in-memory SQLite database
/// is destroyed the moment its last connection closes.
/// </summary>
public sealed class TestDb : IDisposable
{
    private readonly SqliteConnection _connection;

    public AppDbContext Db { get; }

    public TestDb()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        Db = new TestAppDbContext(options);
        Db.Database.EnsureCreated();
    }

    /// <summary>
    /// A second context over the same database, for asserting on persisted state without
    /// reading through the first context's change tracker.
    /// </summary>
    public AppDbContext NewContext() =>
        new TestAppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options);

    public void Dispose()
    {
        Db.Dispose();
        _connection.Dispose();
    }

    /// <summary>
    /// The production model declares Postgres defaults (<c>gen_random_uuid()</c>, <c>NOW()</c>)
    /// that SQLite can't compile into its DDL. Everything else about the model — relationships,
    /// indexes, enum-to-string conversions — is kept exactly as production has it, so the
    /// tests exercise the real mapping.
    /// </summary>
    private sealed class TestAppDbContext(DbContextOptions<AppDbContext> options) : AppDbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // The numeric(n,m) column types are left alone — SQLite's type affinity accepts
            // them, so decimal columns still round-trip correctly.
            foreach (var property in builder.Model.GetEntityTypes().SelectMany(e => e.GetProperties()))
                property.SetDefaultValueSql(null);
        }
    }
}
