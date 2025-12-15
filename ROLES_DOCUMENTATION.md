# Role System Documentation

This application uses three distinct role systems, each serving a different purpose. Understanding these systems is critical for proper access control and user management.

---

## 1. System Authorization Roles (`user_roles` table)

**Purpose:** Control system-wide permissions and access to administrative features.

**Database:** `user_roles` table using `app_role` enum

**Roles:**
- **`security_admin`**: Full system administrator
  - Can manage all users and projects
  - Can create and delete projects
  - Access to all system settings
  
- **`security_user`**: Standard authenticated user
  - Basic access to projects they're members of
  - Cannot manage users or system settings
  
- **`security_delivery`**: Delivery team member with elevated permissions
  - Can create projects
  - Can manage certain project settings
  - Similar to security_admin for project management

- **`security_mentor`**: Mentor with advisory access
  - Can provide guidance and oversight
  - Advisory access to projects and teams
  - Cannot modify system settings or create projects

**Usage:** Checked via `user_roles` table and `has_role()` database function for system-level permissions.

**Automatic Assignment:** System authorization roles are automatically assigned based on organizational roles:
- `delivery` → `security_delivery`
- `sa_mentor`, `ia_mentor` → `security_mentor`
- `security_architect`, `risk_manager`, `sec_mon`, `sec_eng` → `security_user`
- `admin` → `security_admin`

This mapping is enforced by a database trigger that automatically updates system roles when organizational roles change.

---

## 2. Organizational Roles (`profiles.primary_role` column)

**Purpose:** Represent a user's job function or position within the organization.

**Database:** `profiles` table using `organizational_role` enum

**Roles:**
- **`delivery`**: Project delivery team members
- **`security_architect`**: Security architecture specialists
- **`risk_manager`**: Information assurance / risk management professionals
- **`sec_mon`**: Security monitoring analysts
- **`sec_eng`**: Security engineering specialists
- **`sa_mentor`**: Security architect mentors
- **`ia_mentor`**: Information assurance mentors
- **`admin`**: Administrative staff members

**Usage:** 
- Used for workstream assignments
- Used for day rate calculations (SFIA-based)
- Used to filter available users when assigning to projects
- Does NOT directly control permissions

**Important:** This role describes WHAT the person does in the organization, not what they can DO in the system.

---

## 3. Project-Specific Roles (`project_members.role` column)

**Purpose:** Define a user's role and permissions within a specific project.

**Database:** `project_members` table using `project_role` enum

**Roles:**
- **`delivery`**: Project delivery team member (formerly project_owner, project_admin, project_delivery merged)
  - Can delete project
  - Can manage team members
  - Can update all project data
  
- **`security_architect`**: Security architecture role
  - Can write to tables and threats
  - Cannot manage team
  
- **`risk_manager`**: Risk management role
  - Can write to tables and risk appetite
  - Can manage team members
  
- **`sec_mon`**: Security monitoring role (formerly SOC)
  - Can write threats
  - Cannot write to other tables
  
- **`sec_eng`**: Security engineering role (duplicate of sec_mon functionality)
  - Can write threats
  - Cannot write to other tables

**Usage:** Checked via `useProjectPermissions` hook and database functions like `user_can_write_tables()`, `user_can_write_threats()`, etc.

---

## Key Principles

### 1. Clear Separation of Concerns
- **System roles** (`user_roles`) → System-wide permissions
- **Organizational roles** (`primary_role`) → Job function/position
- **Project roles** (`project_members.role`) → Project-specific permissions

### 2. No Overlap in Names
- System roles use `security_` prefix (security_admin, security_user, security_delivery)
- Organizational roles use job titles (delivery, security_architect, risk_manager, sec_mon, sec_eng, sa_mentor, ia_mentor, admin)
- Project roles use clear function names (delivery, security_architect, risk_manager, sec_mon, sec_eng)

### 3. Role Assignment Flow
1. User is created → Assigned a system authorization role in `user_roles`
2. User profile is set → Assigned an organizational role in `profiles.primary_role`
3. User joins project → Assigned a project role in `project_members.role`

### 4. Permission Checking
- **For system features:** Check `user_roles` table
  ```typescript
  const { canCreate } = useCanCreateProjects(userId);
  ```
  
- **For project features:** Check `project_members` role
  ```typescript
  const { permissions } = useProjectPermissions(projectId, userId);
  ```

---

## Common Scenarios

### Adding a New User
1. Create user account (Auth)
2. Add entry to `user_roles` with appropriate `app_role` (via System Roles page)
3. Set `primary_role` in `profiles` based on their job function
4. Add to projects as needed with appropriate `project_role`

### Changing User Permissions
- **System-wide:** Update via System Roles page (`/system-roles`) - only accessible to security_admin
- **Organization:** Update `primary_role` in `profiles`
- **Project-specific:** Update `role` in `project_members`

### Checking if User Can Edit Project Data
1. Check if user is project member: `user_has_project_access()`
2. Check specific permission: `user_can_write_tables()`, `user_can_write_threats()`, etc.
3. These functions check the `project_role` in `project_members`

---

## Migration Notes

Recent changes (November 2025):
- Created separate `organizational_role` enum for `profiles.primary_role` with 8 roles:
  - `delivery`, `security_architect`, `risk_manager`, `sec_mon`, `sec_eng`, `sa_mentor`, `ia_mentor`, `admin`
- Simplified project roles to 5 clear roles:
  - `delivery` (merged project_owner, project_admin, project_delivery)
  - `security_architect` (unchanged)
  - `risk_manager` (unchanged)
  - `sec_mon` (renamed from soc)
  - `sec_eng` (new, duplicate of sec_mon functionality)
- Removed ambiguous `mentor` role from project roles
- Updated all permission checks to use new role names
- Clarified that `user_roles` is for system authorization only
- Note: Organizational and project roles can have same names but serve different purposes

---

## Code References

### Pages
- `SystemRoles` (`/system-roles`): Manage system authorization roles (security_admin only)
- `CreateUser`: Create new users with organizational roles
- `ManageTeam`: Manage all users and their organizational roles

### Hooks
- `useCanCreateProjects`: Checks system authorization
- `useProjectPermissions`: Checks project-specific permissions
- `useProjectMembers`: Manages project team members

### Database Functions
- `has_role(user_id, app_role)`: Check system role
- `user_project_role(user_id, project_id)`: Get user's project role
- `user_can_write_tables()`: Check project table write permission
- `user_can_write_threats()`: Check project threat write permission
- `user_can_write_risk_appetite()`: Check project risk appetite write permission

### Components
- `ProjectTeamManager`: Manages project team and roles
- `WorkstreamTeamManager`: Manages organizational team assignments
- `ManageTeam`: User management interface
