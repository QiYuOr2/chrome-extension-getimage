chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { start } = request;

  if (start) {
    const images = document.getElementsByTagName('img');
    const imgSrcList = Array.from(images).map((img) => img.src);
    sendResponse(imgSrcList);
  }
});
