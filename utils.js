(function(window) {
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
            closeButton.onclick = () => {
                modal.style.display = 'none';
            };
            modal.appendChild(closeButton);
            document.body.appendChild(modal);
        }
        modal.querySelector('p').textContent = message;
        modal.style.display = 'block';
    }

    window.showCustomAlert = showCustomAlert;
})(window);

