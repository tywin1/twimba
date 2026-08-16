import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"
import { getDatabase,
         ref,
         push,
         onValue,
         remove,
         update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"

const firebaseConfig = {
    databaseURL: "https://leads-tracker-7aeae-default-rtdb.firebaseio.com/"
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const referenceInDB = ref(database, "handleTweetBtnClick")

let tweetsData = [];
let tweetIdToDelete = null;

document.addEventListener('click', function(e){
    if (e.target.dataset.like) {
        handleLikeClick(e.target.dataset.like)
    }
    else if (e.target.dataset.retweet) {
        handleRetweetClick(e.target.dataset.retweet)
    }
    else if (e.target.dataset.reply) {
        handleReplyClick(e.target.dataset.reply)
    }
    else if (e.target.dataset.delete) {
        handleDeleteClick(e.target.dataset.delete)
    }
    else if (e.target.id === 'confirm-delete-btn') {
        const targetTweetObj = tweetsData.find(tweet => tweet.uuid === tweetIdToDelete);
        if (targetTweetObj) {
            const specificTweetRef = ref(database, `handleTweetBtnClick/${targetTweetObj.id}`);
            remove(specificTweetRef);
        }
        closeDeleteModal();
    }
    else if (e.target.id === 'cancel-delete-btn' || e.target.id === 'modal-overlay') {
        closeDeleteModal();
    }
    else if (e.target.id === 'tweet-btn') {
        handleTweetBtnClick(e)
    }
    else if (e.target.dataset.submitReply) {
        handleSubmitReplyClick(e.target.dataset.submitReply)
    }
})

function closeDeleteModal() {
    const deleteModal = document.getElementById('delete-modal');
    if (deleteModal) {
        deleteModal.classList.add('hidden');
    }
    tweetIdToDelete = null;
}

function handleLikeClick(tweetId){ 
    const targetTweetObj = tweetsData.find(tweet => tweet.uuid === tweetId)

    if (targetTweetObj) {
        const newLikes = targetTweetObj.isLiked ? targetTweetObj.likes - 1 : targetTweetObj.likes + 1
        const newIsLiked = !targetTweetObj.isLiked

        const specificTweetRef = ref(database, `handleTweetBtnClick/${targetTweetObj.id}`)
        
        update(specificTweetRef, {
            likes: newLikes,
            isLiked: newIsLiked
        })
    }
}

function handleRetweetClick(tweetId){
    const targetTweetObj = tweetsData.find(tweet => tweet.uuid === tweetId)
    
    if (targetTweetObj) {
        const newRetweets = targetTweetObj.isRetweeted ? targetTweetObj.retweets - 1 : targetTweetObj.retweets + 1
        const newIsRetweeted = !targetTweetObj.isRetweeted

        const specificTweetRef = ref(database, `handleTweetBtnClick/${targetTweetObj.id}`)
        
        update(specificTweetRef, {
            retweets: newRetweets,
            isRetweeted: newIsRetweeted
        })
    }
}

    function handleReplyClick(replyId){
        document.getElementById(`replies-${replyId}`).classList.toggle('hidden')
    }

    function handleDeleteClick(tweetId){
        tweetIdToDelete = tweetId;
        document.getElementById('delete-modal').classList.remove('hidden');
    }

function handleSubmitReplyClick(tweetUuid) {
    const replyInput = document.getElementById(`reply-input-${tweetUuid}`);
    const replyText = replyInput.value.trim()

    if (replyText) {
        const targetTweetObj = tweetsData.find(tweet => tweet.uuid === tweetUuid)

        if (targetTweetObj) {
            const newReplyObj = {
                handle: `@tywin1`,
                profilePic:`images/tywin1.jpg`,
                tweetText: replyText
            }

            const currentReplies = targetTweetObj.replies ? [...targetTweetObj.replies] : []
            currentReplies.push(newReplyObj)
            const specificTweetRef = ref(database, `handleTweetBtnClick/${targetTweetObj.id}`)
            update(specificTweetRef, {
                replies: currentReplies
            })
            replyInput.value = ''
        }
    }
}

let lastSubmittedValue = "";

function handleTweetBtnClick(event){
    const tweetInput = document.getElementById('tweet-input')
    const currentValue = tweetInput.value.trim();

    if (currentValue === lastSubmittedValue) {
        event.preventDefault();
        return;
    }

    if(tweetInput.value) {
        lastSubmittedValue = currentValue;
        
        const newTweetObj = {
            handle: `@tywin1`,
            profilePic: `images/tywin1.jpg`,
            likes: 0,
            retweets: 0,
            tweetText: tweetInput.value,
            replies: [],
            isLiked: false,
            isRetweeted: false,
            uuid: uuidv4()
        }
        push(referenceInDB, newTweetObj)
        tweetInput.value = ''
    }
}

function getFeedHtml(){
    let feedHtml = ``
    
    tweetsData.forEach(function(tweet){
        
        let likeIconClass = ''
        if (tweet.isLiked){
            likeIconClass = 'liked'
        }
        
        let retweetIconClass = ''
        if (tweet.isRetweeted){
            retweetIconClass = 'retweeted'
        }
        
        let repliesHtml = ''
        if(tweet.replies && tweet.replies.length > 0){
            tweet.replies.forEach(function(reply){
                repliesHtml+=`
<div class="tweet-reply">
    <div class="tweet-inner">
        <img src="${reply.profilePic}" class="profile-pic">
            <div>
                <p class="handle">${reply.handle}</p>
                <p class="tweet-text">${reply.tweetText}</p>
            </div>
        </div>
</div>
`
            })
        }
        
        feedHtml += `
<div class="tweet">
    <div class="tweet-inner">
        <img src="${tweet.profilePic}" class="profile-pic">
        <div>
            <p class="handle">${tweet.handle}</p>
            <p class="tweet-text">${tweet.tweetText}</p>
            <div class="tweet-details">
                <span class="tweet-detail">
                    <i class="fa-regular fa-comment-dots"
                    data-reply="${tweet.uuid}"
                    ></i>
                    ${tweet.replies ? tweet.replies.length : 0}
                </span>
                <span class="tweet-detail">
                    <i class="fa-solid fa-heart ${likeIconClass}"
                    data-like="${tweet.uuid}"
                    ></i>
                    ${tweet.likes}
                </span>
                <span class="tweet-detail">
                    <i class="fa-solid fa-retweet ${retweetIconClass}"
                    data-retweet="${tweet.uuid}"
                    ></i>
                    ${tweet.retweets}
                </span>
                <span class="tweet-detail">
                    <i class="fa-solid fa-trash"
                    data-delete="${tweet.uuid}"
                    ></i>
                </span>
            </div>   
        </div>            
    </div>
    <div class="hidden" id="replies-${tweet.uuid}">
    <div class="reply-input-area">
    <input type="text"
    placeholder="Tweet your reply..."
    id="reply-input-${tweet.uuid}"
    class="reply-input">
    <button class="reply-btn" data-submit-reply="${tweet.uuid}">Reply</button>
    </div>
        ${repliesHtml}
    </div>   
</div>
`
   })
   return feedHtml 
}

function render(){
    document.getElementById('feed').innerHTML = getFeedHtml()
}

onValue(referenceInDB, function(snapshot) {
    if (snapshot.exists()) {
        const snapshotValues = snapshot.val()
                const cleanTweets = Object.entries(snapshotValues)
            .filter(function([key, tweet]) {
                return tweet && typeof tweet === 'object' && tweet.tweetText;
            })
            .map(function([key, tweet]) {
                if (!tweet.replies) {
                    tweet.replies = [];
                }
                return {
                    ...tweet,
                    id: key
                };
            })

        tweetsData = cleanTweets.reverse()
    } else {
        tweetsData = []; 
    }
    render()
})

