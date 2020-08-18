const CLIENT_ID = '576661467763-gkd9gtfdogqce0pldm6m5v59nheb7g4c.apps.googleusercontent.com';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'];
const SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl';
// const SCOPE = 'https://www.googleapis.com/auth/userinfo.profile'
const APIKEY = 'AIzaSyCqgbt6pYz6DjNehuusOm_OC18BoYxpBZQ';
var GoogleAuth;

const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const channelForm = document.getElementById('channel-form');
const channelInput = document.getElementById('channel-input');
const videoContainer = document.getElementById('video-container');
const contentLoggedIn = document.getElementById('content-loggedin');
const contentLoggedOut = document.getElementById('content-loggedout');
const defaultChannel = 'thenewboston';

// handle change channel
channelForm.addEventListener('click', e => {
    e.preventDefault();
    const channel = channelInput.value;
    getChannel(channel);
})

// Load Auth2 library
function handleClientLoad(){
    gapi.load('client:auth2', initClient)
}

//Init API client library and set up signin listeners
function initClient(){
    const discoveryUrl = 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest';
    gapi.client.init({
        'apiKey' : APIKEY,
        'clientId' : CLIENT_ID,
        'discoveryDocs' : DISCOVERY_DOCS,
        'scope' : SCOPE
    }).then(() => {        
        GoogleAuth = gapi.auth2.getAuthInstance();

        // Listen for sign in state changes
        GoogleAuth.isSignedIn.listen(updateSigninStatus);

        // Handle initial sigin state
        updateSigninStatus(GoogleAuth.isSignedIn.get());

        authorizeButton.addEventListener("click", handleAuthClick);
        signoutButton.addEventListener("click", handleSignoutClick);
    })
}



// uppdate UI signin state
function updateSigninStatus(isSigned){
    var user = GoogleAuth.currentUser.get();
    var isAuthorized = user.hasGrantedScopes(SCOPE);
    if(isAuthorized){
        var authorisedUserName = JSON.parse(JSON.stringify(user.Ot.Cd));
        document.getElementById('username').innerHTML = authorisedUserName;
        document.getElementById('content-loggedin').style.display = 'block';
        document.getElementById('login-nav').style.display = 'block';
        document.getElementById('content-loggedout').style.display = 'none';  
        getChannel(defaultChannel);
    }else{
        document.getElementById('content-loggedin').style.display = 'none';
        document.getElementById('login-nav').style.display = 'none';
        document.getElementById('content-loggedout').style.display = 'block';        
    }
}

// Handle login
function handleAuthClick(){
    GoogleAuth.signIn();
}

// Handle logout
function handleSignoutClick(){
    GoogleAuth.signOut();
}

// Display channel data
function showChannelData(data){
    const channelData = document.getElementById('channel-data');
    channelData.innerHTML = data;
}

// Get channel from API
function getChannel(channel){
    gapi.client.youtube.channels.list({
        part : 'snippet, contentDetails, statistics',
        forUsername : channel
    }).then(res => {
            
            const channel = res.result.items[0];
            // console.log(res);
            const output = `
                <span class="col-md-6 d-flex mx-auto">
                    <img class="mx-auto" src="${channel.snippet.thumbnails.medium.url}" />
                </span>
                <span class="col-md-6">
                    <ul class="c-list">
                        <li>Title : <strong> ${channel.snippet.title}</strong> </li>
                        <li>Subcribers : <strong> ${numberWithCommas(channel.statistics.subscriberCount)} </strong></li>
                        <li>Views : <strong>${numberWithCommas(channel.statistics.viewCount)}</strong></li>
                        <li>Videos : <strong>${numberWithCommas(channel.statistics.videoCount)}</strong></li>
                    </ul>
                    <p>${channel.snippet.description}</p><hr>
                    <a class="btn btn-primary" target="_blank" href="https://youtube.com/${channel.snippet.customUrl}">
                    Visit Channel
                    </a>
                </span>
            `
            showChannelData(output);

            const playListId = channel.contentDetails.relatedPlaylists.uploads;
            requestVideoPlaylist(playListId);

        })
        .catch(err => {
            alert('No channel by that name')
        })
}

// seperate numbers with commas
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// requset video playlist
function requestVideoPlaylist(playlistId){
    const requestOptions = {
        playlistId : playlistId,
        part : 'snippet',
        maxResults : 10
    }
    const request = gapi.client.youtube.playlistItems.list(requestOptions);
    request.execute(response => {
        const playListItems = response.result.items;
        if(playListItems){
            let output = ' ';
            playListItems.forEach(item => {
                const videoId = item.snippet.resourceId.videoId;
                const videoDescription = item.snippet.description;
                let videoDescriptionArray = videoDescription.split('');
                let videoDescriptionShort = videoDescriptionArray.splice(0,100).join('') + ' ...';

                output += `
                    <div class="video">
                        <iframe width="100%" height="auto" src="https://www.youtube.com/embed/${videoId}" 
                            frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; 
                            picture-in-picture" allowfullscreen>
                        </iframe>
                        <p class='px-1'>${videoDescriptionShort}</p>
                    </div>
                `
            });
            videoContainer.innerHTML = output;

        }else{
            videoContainer.innerHTML = 'No Videos Found';
        }
    })
}