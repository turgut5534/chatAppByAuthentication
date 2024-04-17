const socket = io();

const messageForm = document.querySelector('#message-form')

const userId = document.querySelector('#user-id').value
const roomId= document.querySelector('#room-id').value

messageForm.addEventListener('submit', (e) => {

    e.preventDefault()

    const message = document.querySelector('input[type="text"]').value
   
    const input = messageForm.querySelector('input[name="message"]');

    input.value = ""
    
    socket.emit('message', {message, userId, roomId})

})

socket.on('sendToClient', (data) => {
    // Create a new Date object to get the current time
    const currentTime = new Date();

    // Get the current time components and pad them with leading zeros if necessary
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');

    // Format the time components
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    // Create a new message element
    const newMessageElement = document.createElement('div');
    newMessageElement.textContent = `${data.user}: ${data.message}`;

    // Check if the message is from the current user and style accordingly
    if (data.userId == userId) {
        newMessageElement.classList.add('mymessage');
    } else {
        newMessageElement.classList.add('message');
    }

    // Append the new message to the messages container
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.appendChild(newMessageElement);

    // Create a span element for the time and style it
    const timeSpan = document.createElement('span');
    timeSpan.textContent = formattedTime;
    timeSpan.classList.add('message-time');
    timeSpan.style.fontSize = 'small'; // Make the time smaller
    timeSpan.style.display = 'block'; // Display the time on a new line

    // Append the time span below the message
    newMessageElement.appendChild(timeSpan);
});


socket.on('notify', (data) =>{

    const newMessageElement = document.createElement('div');
    newMessageElement.textContent = `${data.user}: ${data.message}`;
    newMessageElement.classList.add('notify');
    if(data.status) {
        newMessageElement.classList.add('green')
    }
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.appendChild(newMessageElement);

})


socket.emit('userLoggedIn', {room: roomId})

socket.on('showOnline', (data) => {
    const onlineUsersList = document.getElementById('online-users-list');
    onlineUsersList.innerHTML = ''; // Clear previous list

    for (const user of data.users) {
        const listItem = document.createElement('li');
        listItem.className = "user-"+user.id
        listItem.textContent = user.firstName; // Assuming the username property exists for each user
        onlineUsersList.appendChild(listItem);
    }
});

socket.on('userLoggedOut', (data) => {
    
    const onlineUserName = document.querySelector(".user-"+data.userId)
    
    if(onlineUserName) {
        onlineUserName.remove()
    }
})
