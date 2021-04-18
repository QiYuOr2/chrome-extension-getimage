let srcList;

const getImageBtn = document.getElementById('get');

getImageBtn.addEventListener('click', async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    let message = { start: true };
    chrome.tabs.sendMessage(tab.id, message, (res) => {
      srcList = Array.from(new Set(res));
      const imgList = srcList.map((src) => `<img src="${src}" />`).join('');

      document.getElementById('app').innerHTML = imgList;
    });
  });

  // async/await 写法
  // let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // let message = { start: true };
  // chrome.tabs.sendMessage(tab.id, message, (res) => {
  //   srcList = Array.from(new Set(res));
  //   const imgList = srcList.map((src) => `<img src="${src}" />`).join('');

  //   document.getElementById('app').innerHTML = imgList;
  // });
});

const saveImageBtn = document.getElementById('save');

saveImageBtn.addEventListener('click', async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!srcList) {
      document.getElementById('app').innerHTML = '未获取图片';
      return;
    }

    chrome.storage.local.set({ srcList });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: showSrc,
    });

    srcList.forEach((src) => {
      chrome.downloads.download({
        url: src,
      });
    });
  });

  // async/await写法
  // let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // if (!srcList) {
  //   document.getElementById('app').innerHTML = '未获取图片';
  //   return;
  // }

  // chrome.storage.local.set({ srcList });

  // chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   function: showSrc,
  // });

  // srcList.forEach((src) => {
  //   chrome.downloads.download({
  //     url: src,
  //   });
  // });
});

function showSrc() {
  chrome.storage.local.get('srcList', ({ srcList }) => {
    console.log(srcList);
  });
}
