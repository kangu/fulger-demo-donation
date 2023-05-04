export function copyToClipboard(e) {
    const cmdInput = e.target.previousElementSibling;
    const iOS = navigator.userAgent.match(/ipad|iphone/i);
    if (iOS) {
        const range = document.createRange();
        range.selectNodeContents(cmdInput);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        cmdInput.select();
    }

    cmdInput.setSelectionRange(0, 999999);

    const success = document.execCommand('copy');

    if (success) {
        console.log('Copied this command to clipboard!', cmdInput.value);
    } else {
        console.log('Copying command to clipboard failed :-(');
    }

    e.target.focus()
}
