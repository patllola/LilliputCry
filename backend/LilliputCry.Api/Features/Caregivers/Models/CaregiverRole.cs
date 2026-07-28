namespace TinyTrack.Api.Features.Caregivers.Models;

/// <summary>
/// What a person can do with a baby's data. Ordered least- to most-privileged;
/// use <see cref="CaregiverRoleExtensions.Rank"/> for comparisons rather than the
/// enum value, so reordering members can't silently change permission checks.
/// </summary>
public enum CaregiverRole
{
    Read,
    Log,
    Full,
    Owner
}

public static class CaregiverRoleExtensions
{
    public static int Rank(this CaregiverRole role) => role switch
    {
        CaregiverRole.Read => 0,
        CaregiverRole.Log => 1,
        CaregiverRole.Full => 2,
        CaregiverRole.Owner => 3,
        _ => 0
    };

    public static bool AtLeast(this CaregiverRole role, CaregiverRole minimum) =>
        role.Rank() >= minimum.Rank();

    /// Maps the wire values the mobile app sends ("full", "log", "read") to the enum.
    public static bool TryParseWire(string? value, out CaregiverRole role)
    {
        role = CaregiverRole.Read;
        if (string.IsNullOrWhiteSpace(value)) return false;

        switch (value.Trim().ToLowerInvariant())
        {
            case "full": role = CaregiverRole.Full; return true;
            case "log": role = CaregiverRole.Log; return true;
            case "read": role = CaregiverRole.Read; return true;
            // "owner" is implicit (the baby's creator) and can never be granted.
            default: return false;
        }
    }

    /// The lowercase wire value the mobile app's `Role` union expects.
    public static string ToWire(this CaregiverRole role) => role.ToString().ToLowerInvariant();
}
