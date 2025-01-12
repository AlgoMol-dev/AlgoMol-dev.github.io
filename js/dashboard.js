/****************************************
 * 1. Initialize LeanCloud
 ****************************************/
AV.init({
    appId: 'ZxhupKKmXgSXHf1uyEckW1xv-gzGzoHsz',
    appKey: '3YQM3gLlbLMBy3mmZulgwIlS',
    serverURL: 'https://zxhupkkm.lc-cn-n1-shared.com'
});

// DOM references
const userSection = document.getElementById('user-section');
const adminSection = document.getElementById('admin-section');
const crudSection = document.getElementById('crud-section');

const currentUserEl = document.getElementById('current-user');
const approvalWarningEl = document.getElementById('approval-warning');
const btnLogout = document.getElementById('btn-logout');

const btnLoadPending = document.getElementById('btn-load-pending');
const pendingUsers = document.getElementById('pending-users');

const inputItem = document.getElementById('inputItem');
const btnCreate = document.getElementById('btnCreate');
const btnLoad = document.getElementById('btnLoad');
const itemsList = document.getElementById('itemsList');

// LeanCloud class
const ItemClass = AV.Object.extend('Item');

/****************************************
 * 2. On Page Load: Check Login
 ****************************************/
checkLoginState();

async function checkLoginState() {
    const currentUser = AV.User.current();
    if (!currentUser) {
        // If not logged in, redirect to login
        window.location.href = 'login.html';
        return;
    }

    // Show user section, hide others initially
    userSection.classList.remove('hidden');
    currentUserEl.textContent = currentUser.getUsername();

    // Check roles
    if (await isAdmin(currentUser)) {
        adminSection.classList.remove('hidden');
    }

    if (await canUserDoCRUD(currentUser)) {
        approvalWarningEl.classList.add('hidden');
        crudSection.classList.remove('hidden');
    } else {
        // Show warning
        approvalWarningEl.classList.remove('hidden');
    }
}

// Simple role checks (for demonstration)
async function isAdmin(user) {
    if (!user) return false;
    const roles = await user.getRoles();
    return roles.some(r => r.getName() === 'Admin');
}

async function canUserDoCRUD(user) {
    if (!user) return false;
    const roles = await user.getRoles();
    return roles.some(r => r.getName() === 'Approved');
}

/****************************************
 * 3. Logout
 ****************************************/
btnLogout.addEventListener('click', async () => {
    try {
        await AV.User.logOut();
        alert('You have logged out!');
        window.location.href = 'login.html';
    } catch (err) {
        console.error('Logout error:', err);
    }
});

/****************************************
 * 4. Admin: Load Unapproved Users
 ****************************************/
btnLoadPending.addEventListener('click', async () => {
    const currentUser = AV.User.current();
    if (!currentUser || !(await isAdmin(currentUser))) {
        alert('Only admin can load pending users.');
        return;
    }

    try {
        // fetch all users
        const allUsersQuery = new AV.Query('_User');
        allUsersQuery.limit(1000);
        const allUsers = await allUsersQuery.find();

        // fetch "Approved" role
        const roleQuery = new AV.Query(AV.Role);
        roleQuery.equalTo('name', 'Approved');
        const approvedRole = await roleQuery.first();
        if (!approvedRole) {
            alert('Could not find the "Approved" role.');
            return;
        }

        // get users in "Approved"
        const approvedUsersQuery = approvedRole.getUsers().query();
        approvedUsersQuery.limit(1000);
        const approvedUsers = await approvedUsersQuery.find();
        const approvedIds = new Set(approvedUsers.map(u => u.id));

        // filter non-approved
        const notApproved = allUsers.filter(u => !approvedIds.has(u.id));

        // display them
        pendingUsers.innerHTML = '';
        if (notApproved.length === 0) {
            pendingUsers.innerHTML = '<li>No unapproved users found.</li>';
            return;
        }
        notApproved.forEach(u => {
            const li = document.createElement('li');
            li.textContent = u.getUsername();

            const approveBtn = document.createElement('button');
            approveBtn.textContent = 'Approve';
            approveBtn.className = 'approve-btn';
            approveBtn.addEventListener('click', () => approveUser(u, li));

            li.appendChild(approveBtn);
            pendingUsers.appendChild(li);
        });

    } catch (err) {
        console.error('Error loading pending users:', err);
        alert(`Failed to load pending users: ${err.message}`);
    }
});

async function approveUser(userObj, liElement) {
    if (!confirm(`Approve user ${userObj.getUsername()}?`)) {
        return;
    }
    try {
        // find "Approved" role
        const roleQuery = new AV.Query(AV.Role);
        roleQuery.equalTo('name', 'Approved');
        const approvedRole = await roleQuery.first();
        if (!approvedRole) {
            throw new Error('No "Approved" role.');
        }
        approvedRole.getUsers().add(userObj);
        await approvedRole.save();

        // remove from UI
        if (liElement.parentNode) {
            liElement.parentNode.removeChild(liElement);
        }
        alert(`${userObj.getUsername()} is now Approved.`);
    } catch (err) {
        console.error('Approve error:', err);
        alert(`Approve failed: ${err.message}`);
    }
}

/****************************************
 * 5. CRUD: Create, Read, Delete
 ****************************************/
btnCreate.addEventListener('click', createItem);
btnLoad.addEventListener('click', loadItems);

async function createItem() {
    const currentUser = AV.User.current();
    if (!currentUser || !(await canUserDoCRUD(currentUser))) {
        alert('Not approved to create items.');
        return;
    }

    const itemName = inputItem.value.trim();
    if (!itemName) {
        alert('Please enter an item name.');
        return;
    }

    const newItem = new ItemClass();
    newItem.set('name', itemName);

    // Public read/write. Domain + role checks block non-logged in usage
    const acl = new AV.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(true);
    newItem.setACL(acl);

    try {
        await newItem.save();
        inputItem.value = '';
        loadItems();
    } catch (err) {
        console.error('Error saving item:', err);
        alert(`Save failed: ${err.message}`);
    }
}

async function loadItems() {
    const currentUser = AV.User.current();
    if (!currentUser || !(await canUserDoCRUD(currentUser))) {
        alert('Not approved to load items.');
        return;
    }

    itemsList.innerHTML = '';
    const query = new AV.Query('Item');
    query.descending('createdAt');

    try {
        const results = await query.find();
        results.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.get('name');

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.className = 'delete-btn';
            delBtn.addEventListener('click', () => deleteItem(item.id, li));

            li.appendChild(delBtn);
            itemsList.appendChild(li);
        });
    } catch (err) {
        console.error('Load error:', err);
        alert(`Load failed: ${err.message}`);
    }
}

async function deleteItem(objectId, liElement) {
    const currentUser = AV.User.current();
    if (!currentUser || !(await canUserDoCRUD(currentUser))) {
        alert('Not approved to delete items.');
        return;
    }
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }

    const itemToDelete = AV.Object.createWithoutData('Item', objectId);
    try {
        await itemToDelete.destroy();
        if (liElement.parentNode) {
            liElement.parentNode.removeChild(liElement);
        }
    } catch (err) {
        console.error('Delete error:', err);
        alert(`Delete failed: ${err.message}`);
    }
}