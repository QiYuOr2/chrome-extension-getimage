# Chrome插件开发入门


最近学习了Chrome插件的开发，总体来说上手还是很容易的，因为浏览器插件本质上依旧是网页，写几个demo基本就了解了他的开发过程。

<!-- more -->

## 什么是Chrome插件

正如开头所说的，Chrome插件实际上就是一个网页，由HTML、CSS、JS、图片等资源组成，与网页不同的是，Chrome插件是用来增强浏览器功能的，同时它还有一套属于自己的开发规则和API。

每个插件都由不同的组件构成，这些组件大都包括background scripts，content scripts，options page，UI以及各种逻辑文件，当然，这些文件是否需要是根据插件的功能所决定的。

接下来我将通过开发一个获取页面图片并保存的插件来介绍如何开发一个Chrome插件。

## 获取页面上的图片

首先，我们需要一个目录来存放这个插件的各个文件。

### 创建manifest

`manifest.json`是一个Chrome插件必不可少的文件，它包含了你插件的所有信息。

```json
{
  "name": "获取图片",
  "description": "获取页面上的所有图片",
  "version": "1.0",
  "manifest_version": 3
}
```

只要在目录中包含`manifest.json`，这个目录就可以被作为一个Chrome插件添加到Chrome当中。

1. 在浏览器地址栏中输入`chrome://extensions`，回车以打开浏览器的扩展程序界面
2. 打开开发人员模式
3. 点击`加载已解压的扩展程序`，选择manifest文件所在的目录

这样我们就成功安装了一个扩展，接下来我们要在此基础上完善它。


#### 用户界面

一个插件可以有多种形式的用户界面，这里我们选择弹出层作为用户界面，在插件根目录下创建一个`popup.html`，这个页面需要包含两个按钮分别用来触发获取图片和保存图片的事件，以及一个用来展示图片的盒子。

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body,
      img {
        width: 400px;
      }
    </style>
  </head>
  <body>
    <button id="get">获取</button>
    <button id="save">保存</button>
    <div id="app"></div>
  </body>
</html>
```
注意，如果在`popup.html`中有中文出现，一定要在head标签中添加`<meta charset="UTF-8" />`，以防止出现乱码。

创建完成后，我们需要在`manifest.json`中声明该页面，以保证浏览器能够正确的读取到它。添加一个`action`对象，同时将`popup.html`设置为该对象的`default_popup`。

```json
{
  "name": "获取图片",
  "description": "获取页面上的所有图片",
  "version": "1.0",
  "manifest_version": 3,
  "action": {
    "default_popup": "popup.html",
  },
}
```

为了让我们的插件像个正经的插件，给他添加上图标。我们需要准备16x16、32x32、48x48以及128x128四种大小的图标图片，将它们放到目录中，之后将它们的路径写入`manifest.json`中。

```json
{
  "name": "获取图片",
  "description": "获取页面上的所有图片",
  "version": "1.0",
  "manifest_version": 3,
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "/images/logo16.png",
      "32": "/images/logo32.png",
      "48": "/images/logo48.png",
      "128": "/images/logo128.png"
    }
  },
}
```

为了让图标能够在扩展程序管理页面显示，我们还需要添加一个`icons`对象。

```json
{
  "name": "获取图片",
  "description": "获取页面上的所有图片",
  "version": "1.0",
  "manifest_version": 3,
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "/images/logo16.png",
      "32": "/images/logo32.png",
      "48": "/images/logo48.png",
      "128": "/images/logo128.png"
    }
  }, 
  "icons": {
    "16": "/images/logo16.png",
    "32": "/images/logo32.png",
    "48": "/images/logo48.png",
    "128": "/images/logo128.png"
  }
}
```

点击扩展程序管理页面中的更新按钮，即可看到添加完用户界面的插件信息了。

#### 功能逻辑

之后我们要为插件添加它应有的功能——获取页面图片。

首先我们先简单梳理一下需求：

1. 点击popup.html中的获取按钮，拿到当前页面的图片
2. 点击popup.html中的保存按钮，将拿到的图片保存下来

实际上我们的插件与当前正在活动的页面并不是同一个页面，因此我们需要通过某种方式来将获取图片的js代码发送到当前活动页上，并且还需要这段js代码能够在获取到图片之后将图片发送到`popup.html`中。

这里我们就需要用到一开始提到的content scripts组件以及content script与popup之间通信的API。content scripts简单来说就是插入页面的脚本，虽说是插入页面的脚本，实际上它与页面原本的js是分割开的，双方不能获取到对方的变量、函数等内容。不过content scripts还是可以获取到dom的。

##### 获取图片

首先添加一个`content-script.js`，这个脚本主要有两个功能，一是获取图片，二是监听popup传来的消息，然后将获取到的图片作为回信传回去。

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // message的数据格式取决于发送时的数据
  const { start } = message;

  if (start) {
    const images = document.getElementsByTagName('img');
    const imgSrcList = Array.from(images).map((img) => img.src);
    sendResponse(imgSrcList);
  }
});
```

之后我们要在`manifest.json`中声明配置它

```json
{
  ...
  "content_scripts": [
    {
      "matches": [
        "<all_urls>"
      ],
      "js": [
        "js/content-script.js"
      ]
    }
  ]
}
```

`matches`声明了content scripts要注入的页面，`<all_urls>`表示所有页面，`js`属性声明了要注入的js脚本，除此之外还有`css`属性声明要注入的css代码、`run_at`属性声明注入时机等都可以在官方文档中找到。

之后添加一个`popup.js`为界面上的按钮注册点击事件，并在`popup.html`中引入它

```javascript
let srcList;
const getImageBtn = document.getElementById('get');

getImageBtn.addEventListener('click', async () => {
  // 获取当前活动页
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    let message = { start: true };
    // 向content scripts发送消息
    chrome.tabs.sendMessage(tab.id, message, (res) => {
      srcList = Array.from(new Set(res));
      // popup中展示图片
      const imgList = srcList.map((src) => `<img src="${src}" />`).join('');

      document.getElementById('app').innerHTML = imgList;
    });
  });
});

const saveImageBtn = document.getElementById('save');

saveImageBtn.addEventListener('click', () => {
  // 保存图片
});
```

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body,
      img {
        width: 400px;
      }
    </style>
  </head>
  <body>
    <button id="get">获取</button>
    <button id="save">保存</button>
    <div id="app"></div>
    <script src="./js/popup.js"></script>
  </body>
</html>
```

这里我们需要注意，插件要想和当前活动页面通信就需要首先获取它的tabId，而要获取当前活动页面的tabId则需要给予插件对应的权限，因此我们需要在`manifest.json`中声明所需要的权限。

```json
{
  ...
  "permissions": [
    "activeTab"
  ]
}
```

完成后更新一下插件，然后打开想要获取图片的页面点击获取按钮即可（如果页面已经提前打开请刷新一下）

##### 保存图片

js可以通过a标签设置href和download属性来实现批量保存图片，但是这里我们要通过调用chrome的download API来实现。

```javascript
...

saveImageBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!srcList) {
      document.getElementById('app').innerHTML = '未获取图片';
      return;
    }
      
    srcList.forEach((src) => {
      chrome.downloads.download({
        url: src,
      });
    });
  });
});
```

与获取活动页面相同，download API同样也需要获取权限

```json
{
  ...
  "permissions": [
    "activeTab",
    "downloads"
  ]
}
```

这样一个获取当前页面图片的插件就完成了。

## 参考文章

- [谷歌官方文档](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [一篇文章教你顺利入门和开发chrome扩展程序（插件）](https://juejin.cn/post/6844903740646899720)
- [入门系列3 - background、content、popup的通信](https://juejin.cn/post/6844903985711677453)