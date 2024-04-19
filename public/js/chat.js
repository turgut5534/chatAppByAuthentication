const socket = io();

const messageForm = document.querySelector('#message-form')

const userId = document.querySelector('#user-id').value
const roomId= document.querySelector('#room-id').value

messageForm.addEventListener('submit', (e) => {

    e.preventDefault()

    const message = document.querySelector('#chat-message-input').value
   
    const input = messageForm.querySelector('input[name="message"]');

    input.value = ""
    
    socket.emit('message', {message, userId, roomId})

})


socket.on('sendToClient', (data) => {

    const currentTime = new Date();
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    var className = 'sender'
    if(data.userId == userId) {
        className= 'repaly'
    }

    $('.messages').append(`<li class="${className}">
        <p><span class="text-danger">${data.user} : </span> ${data.message}</p>
        <span class="time">${formattedTime}</span>
    </li>`)
})


socket.on('notify', (data) =>{

    const newMessageElement = document.createElement('div');
    newMessageElement.textContent = `${data.user}: ${data.message}`;
    newMessageElement.classList.add('notify');
    if(data.status) {
        newMessageElement.classList.add('green')
    } else {
        newMessageElement.classList.add('red')
    }
    const messagesContainer = document.querySelector('.messages');
    messagesContainer.appendChild(newMessageElement);

})


socket.emit('userLoggedIn', {room: roomId})

socket.on('showOnline', (data) => {
    const onlineUsersList = document.querySelector('.chat-list')
    onlineUsersList.innerHTML = ''; // Clear previous list

    $('#people-amount').text(`${data.users.length} Online Users`)

    for (const user of data.users) {

        const file = user.file ? user.file : 'avatar.png'

        $('.chat-list').append(`                                                           
        <a href="#" class="d-flex align-items-center user-${user.id}">
            <div class="flex-shrink-0">
                <img class="img-fluid" src="/images/${file}" alt="user img">
            </div>
            <div class="flex-grow-1 ms-3">
                <h3>${user.firstName} ${user.lastName}</h3>
                <p>front end developer</p>
            </div>
        </a>`
        )

    }
});

socket.on('userLoggedOut', (data) => {
    
    const onlineUserName = document.querySelector(".user-"+data.userId)
    
    if(onlineUserName) {
        onlineUserName.remove()
    }

    $('#people-amount').text(`${data.onlineUsers.length} Online Users`)
})
