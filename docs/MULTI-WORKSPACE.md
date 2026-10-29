# Workspaces, navigation and GitHub namespaces

## Workspace boundaries

GitHub sign-in still requests identity access only (`read:user`). Each account receives its personal workspace. An account can belong to multiple workspaces and can create up to ten owned workspaces, including its personal workspace. Only the owner can rename a workspace. Additional workspaces have one owner seat and zero scan credits: creating workspaces does not multiply the personal free allowance.

The workspace picker appears in the desktop sidebar and above the mobile content. Workspace and team and Usage and billing retain this navigation. On mobile, More opens the remaining destinations. The light/dark mode control is in the branded page header.

A browser tab pins its selected workspace in sessionStorage. Same-origin API requests attach this choice in `x-shiptested-workspace`; the server validates current membership and seat eligibility on every authenticated request. The header is a selector, never authorization. Switching also updates the session default for new tabs. Other already-pinned tabs retain their context. A successful switch reloads the destination to discard old workspace data. API tokens retain their existing workspace scope.

Reports retain their existing creator-based access rules and explicit sharing flow. Workspace membership alone does not expose another member's private reports.

## Multiple GitHub namespaces

Apply migration `011_multi_workspace.sql` before running code that uses customer repository connections. It migrates an existing installation choice into the new per-user, per-workspace selection table without widening permissions.

A user may select up to 20 installations of the configured GitHub App in one workspace. Repository listing combines the selected namespaces, up to 500 repositories total. Each access request rechecks the user's GitHub access and the installation's repository scope. Repository-specific operations use the matching installation, never an arbitrary first installation. Disconnecting a namespace removes that selection. The existing short-lived encrypted authorization must still be renewed when it expires.

A revoked or suspended selected installation fails closed; disconnect or renew the connection before continuing. GitHub accounts with more than 100 installations are currently rejected rather than displaying an incomplete installation inventory.

Connecting namespaces does not grant new GitHub permissions or authorize repairs. Repository connection configuration, installation grants, scan allowance and workers remain separate requirements.

## Billing

This change does not enable payments. Usage and billing presents the existing allowance and subscription status. Checkout remains unavailable when billing is not configured. Team invitations still require an existing eligible Team seat; creating a workspace does not create paid entitlement.

## Verification

Local tests cover workspace creation limits and accounting, owner-only naming, per-tab selection, forged and revoked membership, namespace selection/removal, navigation, theme persistence, mobile layout and disabled billing. Live migrations, provider authorization and deployment require separate verification; fixture-based browser tests are not live provider verification.
