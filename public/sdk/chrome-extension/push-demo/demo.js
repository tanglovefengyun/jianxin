const currentExtensionId = chrome.runtime.id;
const existingElement = document.querySelector('[id^="webpush-demo-"]');
const isSecondPlugin = existingElement && !existingElement.id.includes(currentExtensionId);
const position = isSecondPlugin ? 'left' : 'right';

const div = document.createElement('div')
div.id = `webpush-demo-${currentExtensionId}`
div.style.cssText = `
  position: fixed;
  bottom: 20px;
  ${position}: 20px;
  z-index: 9999;
`

const style = document.createElement('style')
style.textContent = `
  #webpush-demo-popup-${currentExtensionId} {
    position: fixed;
    ${position}: 30px;
    bottom: 200px;
    width: 40px;
    height: 40px;
    background-color: #4285f4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: transform 0.3s ease;
  }
  #webpush-demo-popup-${currentExtensionId}:hover {
    transform: scale(1.1);
  }
  #webpush-demo-form-${currentExtensionId} {
    position: fixed;
    bottom: 216px;
    ${position}: 75px;
    padding: 15px;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    min-width: 400px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  #webpush-demo-form-${currentExtensionId}.show {
    opacity: 1;
    visibility: visible;
  }
  .form-item-${currentExtensionId} {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  .regid-${currentExtensionId} {
    display: inline-block;
    width: 57px;
    padding-left: 52px;
  }
  .form-item-${currentExtensionId} label {
    display: inline-block;
    width: 100px;
    text-align: right;
  }
  .form-input-${currentExtensionId} {
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 3px;
    width: 300px;
  }
  #set-tags-alias-${currentExtensionId} {
    margin-left: 102px;
    padding: 5px 10px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  #set-tags-alias-${currentExtensionId}:hover {
    background-color: #3367d6;
  }
  #clear-data-${currentExtensionId} {
    margin-left: 102px;
    padding: 5px 10px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  #clear-data-${currentExtensionId}:hover {
    background-color: #3367d6;
  }
  #webpush-callback-display-${currentExtensionId},
  #webpush-callback-click-${currentExtensionId},
  #webpush-message-${currentExtensionId} {
    height: 80px;
    color: #4285f4;
  }
  #webpush-regid-${currentExtensionId} {
    margin-left: 40px;
  }
  #webpush-error-${currentExtensionId} li {
    color: red;
    list-style: none;
  }
`
document.head.appendChild(style)

div.innerHTML = `
  <div id="webpush-demo-popup-${currentExtensionId}">Push</div>
  <div id="webpush-demo-form-${currentExtensionId}">
    <div class="form-${currentExtensionId}">
    <div class="form-item-${currentExtensionId}">
        <span class="name-${currentExtensionId}">chrome_name：</span>
        <span id="webpush-name-${currentExtensionId}"></span>
      </div>
      <div class="form-item-${currentExtensionId}">
        <span class="regid-${currentExtensionId}">regid：</span>
        <span id="webpush-regid-${currentExtensionId}"></span>
      </div>
      <div class="form-item-${currentExtensionId}">
        <label for="webpush-tag-${currentExtensionId}">tags：</label>
        <input class="form-input-${currentExtensionId}" type="text" id="webpush-tag-${currentExtensionId}" name="tag" />
      </div>
      <div class="form-item-${currentExtensionId}">
        <label for="webpush-alias-${currentExtensionId}">alias：</label>
        <input class="form-input-${currentExtensionId}" type="text" id="webpush-alias-${currentExtensionId}" name="alias" />
      </div>
      <ul id="webpush-error-${currentExtensionId}"></ul>
      <div class="form-item-${currentExtensionId}">
        <button id="set-tags-alias-${currentExtensionId}">设置tags_alias</button>
      </div>
      <div class="form-item-${currentExtensionId}">
        <label for="webpush-message-${currentExtensionId}" class="message-${currentExtensionId}">推送消息展示：</label>
        <textarea class="form-input-${currentExtensionId}" id="webpush-message-${currentExtensionId}" name="message"></textarea>
      </div>
      <div class="form-item-${currentExtensionId}">
        <label for="webpush-callback-display-${currentExtensionId}" class="message-${currentExtensionId}">消息展示回调：</label>
        <textarea class="form-input-${currentExtensionId}" id="webpush-callback-display-${currentExtensionId}" name="message"></textarea>
      </div>
      <div class="form-item-${currentExtensionId}">
        <label for="webpush-callback-click-${currentExtensionId}" class="message-${currentExtensionId}">消息点击回调：</label>
        <textarea class="form-input-${currentExtensionId}" id="webpush-callback-click-${currentExtensionId}" name="message"></textarea>
      </div>
      <div class="form-item-${currentExtensionId}">
        <button id="clear-data-${currentExtensionId}">清除数据</button>
      </div>
    </div>
  </div>
`
document.body.appendChild(div)
const popup = document.getElementById(`webpush-demo-popup-${currentExtensionId}`)
const form = document.getElementById(`webpush-demo-form-${currentExtensionId}`)

let isEventBound = false;

popup.addEventListener('click', () => {
  form.classList.toggle('show')
  if (form.classList.contains('show') && !isEventBound) {
    bindEvent();
    isEventBound = true;
  }
})

function getElement(idStr) {
  const id = `${idStr}-${currentExtensionId}`
  return document.getElementById(id);
}

function domClick(idStr, cb) {
  const id = `${idStr}-${currentExtensionId}`
  document.getElementById(id)?.addEventListener("click", cb);
}

function setText(idStr, text) {
  let dom = getElement(idStr);
  dom.innerHTML = dom.innerHTML + JSON.stringify(text) + "\n";
}

function clearText(idStr) {
  let dom = getElement(idStr);
  dom.innerHTML = '';
}

function clearAllText() {
  clearText('webpush-message');
  clearText('webpush-callback-click');
  clearText('webpush-callback-display');
}

function bindEvent() {
  domClick('set-tags-alias', () => {
    window.MTpushInterfaceExtension?.setTagsAlias({
      tags: getElement('webpush-tag').value?.split(',') || [],
      alias: getElement('webpush-alias').value
    })
  })
  domClick('clear-data', () => {
    clearAllText()
  })
}

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'MTPUSH_ON_MSG_RECEIVE':
      setText("webpush-message", message.data);
      break;

    case 'MTPUSH_GET_MT_INIT_INFO': 
      getElement('webpush-regid').innerHTML = message.data?.regid
      break;

    case 'MTPUSH_MSG_CALLBACK_CLICK': 
      setText("webpush-callback-click", message.data);
      break;

    case 'MTPUSH_MSG_CALLBACK_DISPLAY': 
      setText("webpush-callback-display", message.data);
      break;
    
    case 'MTPUSH_GET_MANIFEST_INFO':
      console.log('MTPUSH_GET_MANIFEST_INFO', message.data)
      getElement('webpush-name').innerHTML = message.data?.name
      break;
    
    case 'MTPUSH_SET_TAGS_ALIAS_FAIL':
      let str = ''
      for (let i = 0; i < message.data?.length; i++) { 
        str += `<li>${message.data[i]}</li>`
      }
      getElement('webpush-error').innerHTML = str
      break;

    case 'MTPUSH_SET_TAGS_ALIAS_SUCCESS':
      getElement('webpush-tag').value = ''
      getElement('webpush-alias').value = ''
      getElement('webpush-error').innerHTML = ''
      break;
  }
});