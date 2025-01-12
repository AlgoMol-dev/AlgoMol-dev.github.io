// DOM References
const inputItem = document.getElementById('inputItem');
const btnCreate = document.getElementById('btnCreate');
const btnLoad = document.getElementById('btnLoad');
const itemsList = document.getElementById('itemsList');
const btnLoadPending = document.getElementById('btn-load-pending');
const pendingUsers = document.getElementById('pending-users');

// Item Class
const ItemClass = AV.Object.extend('Item');

// CRUD Operations
async function createItem() {
    const currentUser = AV.User.current();
    if (!currentUser) return;

    const itemName = inputItem.value.trim();
    if (!itemName) {
        alert('Please enter an item name.');
        return;
    }

    const newItem = new ItemClass();
    newItem.set('name', itemName);

    const acl = new AV.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(true);
    newItem.setACL(acl);

    try {
        await newItem.save();
        inputItem.value = '';
        loadItems();
    } catch (err) {
        alert(`Save failed: ${err.message}`);
    }
}

async function loadItems() {
    const currentUser = AV.User.current();
    if (!currentUser) return;

    itemsList.innerHTML = '';
    const query = new AV.Query('Item');
    query.descending('createdAt');

    try {
        const results = await query.find();
        results.forEach(createItemElement);
    } catch (err) {
        alert(`Load failed: ${err.message}`);
    }
}

function createItemElement(item) {
    const li = document.createElement('li');
    const itemContent = document.createElement('div');
    itemContent.className = 'item-content';

    // Create main content
    const itemMain = document.createElement('div');
    itemMain.className = 'item-main';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.get('name');

    // Create controls
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-details';
    toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'delete-btn';

    // Create details section
    const details = document.createElement('div');
    details.className = 'item-details';
    const weight = item.get('weight_kg');
    details.innerHTML = `<span style="margin-left: 0.5rem">Weight: ${weight} kg</span>`;

    // Add event listeners
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShowing = details.classList.contains('show');
        details.classList.toggle('show');
        toggleBtn.innerHTML = isShowing
            ? '<i class="fas fa-chevron-down"></i>'
            : '<i class="fas fa-chevron-up"></i>';
    });

    delBtn.addEventListener('click', () => deleteItem(item.id, li));

    // Assemble elements
    controls.appendChild(toggleBtn);
    controls.appendChild(delBtn);
    itemMain.appendChild(nameSpan);
    itemMain.appendChild(controls);
    itemContent.appendChild(itemMain);
    itemContent.appendChild(details);
    li.appendChild(itemContent);
    itemsList.appendChild(li);
}

async function deleteItem(objectId, liElement) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const itemToDelete = AV.Object.createWithoutData('Item', objectId);
        await itemToDelete.destroy();
        liElement.remove();
    } catch (err) {
        alert(`Delete failed: ${err.message}`);
    }
}

// Admin Operations
async function loadPendingUsers() {
    const currentUser = AV.User.current();
    if (!currentUser || !await isAdmin(currentUser)) {
        alert('Only admin can load pending users.');
        return;
    }

    try {
        const allUsers = await new AV.Query('_User').find();
        const approvedRole = await new AV.Query(AV.Role)
            .equalTo('name', 'Approved')
            .first();

        if (!approvedRole) {
            throw new Error('Could not find the "Approved" role.');
        }

        const approvedUsers = await approvedRole.getUsers().query().find();
        const approvedIds = new Set(approvedUsers.map(u => u.id));
        const notApproved = allUsers.filter(u => !approvedIds.has(u.id));

        pendingUsers.innerHTML = notApproved.length === 0
            ? '<li>No unapproved users found.</li>'
            : '';

        notApproved.forEach(createPendingUserElement);
    } catch (err) {
        alert(`Failed to load pending users: ${err.message}`);
    }
}

function createPendingUserElement(user) {
    const li = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = user.getUsername();

    const approveBtn = document.createElement('button');
    approveBtn.textContent = 'Approve';
    approveBtn.className = 'approve-btn';
    approveBtn.onclick = () => approveUser(user, li);

    li.appendChild(nameSpan);
    li.appendChild(approveBtn);
    pendingUsers.appendChild(li);
}

async function approveUser(userObj, liElement) {
    if (!confirm(`Approve user ${userObj.getUsername()}?`)) return;

    try {
        const approvedRole = await new AV.Query(AV.Role)
            .equalTo('name', 'Approved')
            .first();

        if (!approvedRole) {
            throw new Error('Could not find the "Approved" role.');
        }

        approvedRole.getUsers().add(userObj);
        await approvedRole.save();
        liElement.remove();
        alert(`${userObj.getUsername()} is now approved.`);
    } catch (err) {
        alert(`Approval failed: ${err.message}`);
    }
}
