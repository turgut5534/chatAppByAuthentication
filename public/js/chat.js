const socket = io();
Fancybox.bind()

const messageForm = document.querySelector('#message-form')

const userId = document.querySelector('#user-id').value
const roomId= document.querySelector('#room-id').value

var messagesContainer = document.getElementById('messages-container');

window.onload = () => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

messageForm.addEventListener('submit', (e) => {

    e.preventDefault()

    const message = document.querySelector('#chat-message-input').value
   
    const input = messageForm.querySelector('input[name="message"]');

    input.value = ""
    
    socket.emit('message', {message, userId, roomId})
    

})

const getTime = () => {
    const currentTime = new Date();
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    return formattedTime
}

socket.on('sendToClient', (data) => {



    var className = 'sender'
    var messager;
    var isYours= true

    if(data.userId == userId) {
        className= 'repaly'
        messager = ''
    } else {
        messager = `<span class="text-danger">${data.user} : </span>`
        isYours = false
    }

    $('.messages').append(`<li class="${className}">
        <p>${messager}${data.message}</p>
        <span class="time">${getTime()}</span>
    </li>`)

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    if(!isYours) {
        const bip = document.querySelector('#message-bip')
        bip.play()
    }
  
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
    const messagesContainerLocal = document.querySelector('.messages');
    messagesContainerLocal.appendChild(newMessageElement);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

})


socket.emit('userLoggedIn', {room: roomId})

socket.on('showOnline', (data) => {
    const onlineUsersList = document.querySelector('.chat-list')
    onlineUsersList.innerHTML = ''; // Clear previous list

    $('#people-amount').text(`${data.users.length} Online Users`)

    for (const user of data.users) {

        console.log(user)
        const file = user.photo ? '/users/'+user.photo : '/images/avatar.png'

        $('.chat-list').append(`                                                           
        <a href="#" class="d-flex align-items-center user-${user.id}">
            <div class="flex-shrink-0">
                <img class="img-fluid" src="${file}" alt="user img">
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


function upload(files) {
    socket.emit('imageData', { image: files[0], roomId, userId }, (e) => {
        console.log(e)
    });
  }


socket.on('imageDataResponse', function(data){
    
    
    var className = 'sender'

    if(data.userId == userId) {
        className= 'repaly'
        messager = ''
    } else {
        messager = `<span class="text-danger">${data.user} : </span>`
        isYours = false
    }

    $('.messages').append(`<li class="${className}"><a href="/${data.filename}" data-fancybox="gallery" data-caption="${data.filename}"><img style="width: 300px; height: auto;" src="/${data.filename}" alt=""></a>
    <span class="time">${getTime()}</span></li>`)


    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

