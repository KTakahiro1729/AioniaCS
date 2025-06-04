(function(global) {
  function resetButtonText(vm, defaultText, delay = 3000) {
    setTimeout(() => {
      vm.outputButtonText = defaultText;
    }, delay);
  }

  function fallbackCopyTextToClipboard(text, vm, messages) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        vm.outputButtonText = messages.successFallback;
      } else {
        vm.outputButtonText = messages.failed;
      }
    } catch (err) {
      vm.outputButtonText = messages.error;
    }

    resetButtonText(vm, messages.default);
    document.body.removeChild(textArea);
  }

  async function copyToClipboard(text, vm, messages) {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text, vm, messages);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      vm.outputButtonText = messages.success;
      resetButtonText(vm, messages.default);
    } catch (err) {
      console.error('Failed to copy: ', err);
      fallbackCopyTextToClipboard(text, vm, messages);
    }
  }

  function addItem(array, defaultItem, max = Infinity) {
    if (array.length < max) {
      array.push(JSON.parse(JSON.stringify(defaultItem)));
    }
  }

  function removeItem(array, index, emptyItem, hasContentFn = () => true) {
    if (array.length > 1) {
      array.splice(index, 1);
    } else if (array.length === 1 && hasContentFn(array[index])) {
      array[index] = JSON.parse(JSON.stringify(emptyItem));
    }
  }

  function showCustomAlert(message) {
    const alertModalId = 'custom-alert-modal';
    let modal = document.getElementById(alertModalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = alertModalId;
      modal.classList.add('custom-alert-modal');

      const messageP = document.createElement('p');
      messageP.classList.add('custom-alert-message');
      modal.appendChild(messageP);

      const closeButton = document.createElement('button');
      closeButton.textContent = 'OK';
      closeButton.classList.add('custom-alert-button');
      closeButton.onclick = () => modal.remove();
      modal.appendChild(closeButton);
      document.body.appendChild(modal);
    }
    modal.querySelector('p').textContent = message;
    modal.style.display = 'block';
  }

  global.Utils = {
    copyToClipboard,
    resetButtonText,
    addItem,
    removeItem,
    showCustomAlert
  };
})(window);
