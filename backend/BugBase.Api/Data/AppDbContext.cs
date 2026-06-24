using BugBase.Api.Models;          // User, Project, Issue, Comment, ProjectMember
using Microsoft.EntityFrameworkCore;

namespace BugBase.Api.Data;

// The main database context — EF Core uses this class to interact with PostgreSQL.
// DbSet properties map to database tables.
// OnModelCreating configures relationships that EF Core can't infer automatically.
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<ProjectInvitation> ProjectInvitations { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Issue> Issues { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<ProjectMember> ProjectMembers { get; set; }

    // Called once on startup — EF Core builds and caches the model from these instructions
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>()
            .HasOne(p => p.CreatedByUser)
            .WithMany(u => u.CreatedProjects)
            .HasForeignKey(p => p.CreatedBy);

        // ProjectMember has no own ID — primary key is the combination of both FK columns
        modelBuilder.Entity<ProjectMember>()
            .HasKey(pm => new { pm.ProjectId, pm.UserId });

        // Explicitly map ProjectMember → Project (required because of composite key)
        modelBuilder.Entity<ProjectMember>()
            .HasOne(pm => pm.Project)
            .WithMany(p => p.ProjectMembers)
            .HasForeignKey(pm => pm.ProjectId);

        // Explicitly map ProjectMember → User (required because of composite key)
        modelBuilder.Entity<ProjectMember>()
            .HasOne(pm => pm.User)
            .WithMany(u => u.ProjectMembers)
            .HasForeignKey(pm => pm.UserId);

        modelBuilder.Entity<ProjectMember>()
            .Property(pm => pm.Role).HasConversion<string>();

        modelBuilder.Entity<ProjectInvitation>()
            .HasOne(pi => pi.InvitedUser)
            .WithMany()
            .HasForeignKey(pi => pi.InvitedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProjectInvitation>()
            .HasOne(pi => pi.InvitedByUser)
            .WithMany()
            .HasForeignKey(pi => pi.InvitedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProjectInvitation>().Property(pi => pi.Role).HasConversion<string>();
        modelBuilder.Entity<ProjectInvitation>().Property(pi => pi.Status).HasConversion<string>();

        // Issue has two FKs to Users — EF Core can't resolve these automatically,
        // so each navigation property must be mapped explicitly
        modelBuilder.Entity<Issue>()
            .HasOne(i => i.ReportedByUser)
            .WithMany(u => u.ReportedIssues)
            .HasForeignKey(i => i.ReportedBy)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Issue>()
            .HasOne(i => i.AssignedToUser)
            .WithMany(u => u.AssignedIssues)
            .HasForeignKey(i => i.AssignedTo)
            .IsRequired(false);

        modelBuilder.Entity<Issue>()
            .HasOne(i => i.UpdatedByUser)
            .WithMany()
            .HasForeignKey(i => i.UpdatedBy)
            .IsRequired(false);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.User)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.UserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Store enums as strings instead of integers for database readability
        modelBuilder.Entity<Issue>().Property(i => i.Status).HasConversion<string>();
        modelBuilder.Entity<Issue>().Property(i => i.Priority).HasConversion<string>();
    }
}