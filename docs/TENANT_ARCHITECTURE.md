# TENANT ARCHITECTURE

**Project:** College Admission Prediction & Notification Web Application
**Model:** Shared Database, Tenant-Column Isolation
**Last Updated:** 2026-02-24

---

## 1. Isolation Model Choice

This platform uses the **Shared Database, Separate Rows** model with `tenant_id` column on every tenant-scoped table.

| Model                            | Chosen? | Reason                                   |
|----------------------------------|---------|------------------------------------------|
| Separate DB per tenant           | No      | Operationally expensive at scale         |
| Separate schema per tenant       | No      | Complex migrations, harder with Supabase |
| Shared DB, tenant_id column      | **YES** | RLS in Postgres enforces isolation       |

**Enforcement:** Supabase Row Level Security (RLS) is the primary isolation mechanism, backed by application-level middleware.

---

## 2. Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                      SUPER ADMIN                        │
│          Platform owner — sees everything               │
└─────────────────────┬───────────────────────────────────┘
                      │ creates
          ┌───────────▼────────────┐
          │    ADMIN (TENANT)      │  tenant_id = admin.id
          │  Isolated per account  │
          └──────┬──────────┬──────┘
                 │ creates  │ creates
    ┌────────────▼──┐  ┌────▼────────────────┐
    │  COUNSELOR    │  │      STUDENT         │
    │ Sees assigned │  │  Sees own data only  │
    │ students only │  └─────────────────────┘
    └───────────────┘
```

---

## 3. Tenant ID Flow

When an Admin is created:
1. `admins.id` (UUID) is generated — **this becomes the `tenant_id`** for all data under this admin
2. All subsequent tables reference `tenant_id = admins.id`
3. When a counselor or student is created under an admin, they inherit the same `tenant_id`
4. The JWT token issued to any user (admin, counselor, student) contains:
   ```json
   {
     "userId": "...",
     "role": "admin | counselor | student | super_admin",
     "tenantId": "...",
     "email": "...",
     "iat": ...,
     "exp": ...
   }
   ```
5. Every API request extracts `tenantId` from the JWT — clients never send `tenantId` manually

---

## 4. Access Matrix

| Action                          | SuperAdmin | Admin | Counselor | Student |
|---------------------------------|-----------|-------|-----------|---------|
| View all admins                 | ✅        | ❌    | ❌        | ❌      |
| Create admin                    | ✅        | ❌    | ❌        | ❌      |
| View own tenant admins          | ✅        | ✅    | ❌        | ❌      |
| View all students (own tenant)  | ✅        | ✅    | ❌        | ❌      |
| View assigned students only     | ✅        | ✅    | ✅        | ❌      |
| View own profile                | N/A       | ✅    | ✅        | ✅      |
| Upload cutoff data              | ❌        | ✅    | ❌        | ❌      |
| Run AI prediction               | ❌        | ❌    | ❌        | ✅      |
| Generate student report         | ❌        | ❌    | ❌        | ✅      |
| Generate counselor report       | ❌        | ❌    | ✅        | ❌      |
| Create notifications            | ✅        | ✅    | ✅*       | ❌      |
| Manage sponsored colleges       | ✅        | ⚙️    | ❌        | ❌      |
| View sponsored (tagged)         | ✅        | ✅    | ✅        | ✅      |
| Platform analytics              | ✅        | ❌    | ❌        | ❌      |
| Tenant analytics                | ✅        | ✅    | ❌        | ❌      |

> *Counselor can only notify their assigned students within their tenant

---

## 5. Row Level Security (RLS) Strategy

Supabase RLS is **enabled on all tenant-scoped tables**. Policies use the JWT `tenantId` and `userId` claims to filter rows.

### How JWT Claims Are Used in RLS

Supabase allows custom JWT claims. We store `tenant_id`, `user_id`, and `role` in the JWT:

```sql
-- Access current user's tenant_id from JWT
auth.jwt() ->> 'tenantId'

-- Access current user's role from JWT
auth.jwt() ->> 'role'

-- Access current user's ID from JWT
auth.jwt() ->> 'userId'
```

### RLS Policy Pattern

```sql
-- Example: Students table
CREATE POLICY "Tenant isolation on students"
  ON students
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Counselors see only assigned students
CREATE POLICY "Counselor sees only assigned students"
  ON students
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    AND (
      auth.jwt() ->> 'role' = 'admin'
      OR assigned_counselor_id = (auth.jwt() ->> 'userId')::uuid
    )
  );

-- Students see only own data
CREATE POLICY "Students see own data only"
  ON student_profiles
  FOR SELECT
  USING (
    student_id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );
```

---

## 6. Application-Level Enforcement

Despite RLS at DB level, all API routes also enforce isolation at the middleware layer:

### Middleware Chain

```
1. validateJWT(req)
   → Decode and verify token
   → Attach { userId, role, tenantId } to req.user

2. requireRole(['admin', 'counselor'])
   → Check req.user.role is in allowed list
   → 403 if not

3. injectTenantFilter(query)
   → Automatically appends WHERE tenant_id = req.user.tenantId
   → Never trust client-provided tenantId

4. enforceOwnership(resourceId)
   → For counselors: verify assigned_counselor_id = req.user.userId
   → For students: verify student_id = req.user.userId
```

### Example — Admin Creating a Student

```javascript
// backend/src/controllers/admin/studentController.js
const createStudent = async (req, res) => {
  const { tenantId, userId } = req.user; // from JWT middleware

  const student = await supabase
    .from('students')
    .insert({
      ...req.body,
      tenant_id: tenantId,   // always injected server-side
      created_by: userId,
      created_by_role: 'admin'
    });
  // ...
};
```

**Rule: `tenant_id` is NEVER accepted from the client request body. Always set server-side from JWT.**

---

## 7. Cross-Tenant Leak Prevention

| Risk                                | Prevention                                    |
|-------------------------------------|-----------------------------------------------|
| Admin A sees Admin B's students     | RLS + middleware tenant_id filter             |
| Counselor sees other tenant students| RLS policy + assigned_counselor_id check      |
| Student accesses other reports      | student_id ownership check + RLS             |
| Client sends forged tenantId        | tenantId only from JWT (never from body)      |
| JWT tampering                       | HMAC-signed JWT with strong secret            |
| OTP replay attack                   | is_used flag, 5-minute expiry                 |
| PDF URL access without auth         | Supabase signed storage URLs (time-limited)   |
| Direct DB access bypass             | RLS enforced even on direct Supabase queries  |

---

## 8. Supabase Configuration Requirements

1. **Enable RLS** on all tenant-scoped tables immediately on creation
2. **Never bypass RLS** with `service_role_key` in application code — only use for admin migrations
3. **Custom JWT claims** must be configured in Supabase Auth hooks or via custom auth flow
4. **Storage buckets** for PDFs must have RLS or signed URL policies
5. **Supabase Realtime** (if used) must be filtered by `tenant_id` channel

---

## 9. Sponsored College Isolation

Sponsored colleges can be:
- **Platform-wide** (`tenant_id = NULL`): visible to all tenants, configured by Super Admin
- **Tenant-specific** (`tenant_id = admin.id`): visible only within that tenant, configured by Admin

The AI engine always checks sponsored status scoped to the requesting tenant:
```sql
SELECT * FROM sponsored_colleges
WHERE is_active = true
  AND (tenant_id = $tenantId OR tenant_id IS NULL)
ORDER BY bias_weight DESC;
```

---

## 10. Tenant Lifecycle

```
Super Admin creates Admin
  → admin record inserted (tenant_id = admin.id)
  → Admin receives OTP login credentials
  → Admin logs in → JWT with tenantId issued

Admin creates Counselor
  → counselor.tenant_id = admin.id
  → Counselor logs in → JWT with same tenantId

Admin creates Student
  → student.tenant_id = admin.id
  → Student logs in → JWT with same tenantId

Admin deactivated
  → admin.is_active = false
  → All counselors and students under tenant lose access
  → Data preserved (soft delete model)
```

---

*This document is the authoritative reference for all isolation decisions.*
*Any RLS policy change must be reviewed against this document.*
