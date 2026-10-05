const form = document.getElementById('translator-form');
const output = document.getElementById('output');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = document.getElementById('text').value.trim();
    const source = document.getElementById('source').value;
    const target = document.getElementById('target').value;

    if (!text) {
        output.textContent = 'Please enter text to translate.';
        return;
    }

    output.textContent = 'Translating...';

    try {
        const response = await fetch('/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, source, target }),
        });

        const data = await response.json();

        if (!response.ok) {
            output.textContent = data.error || 'Failed to translate text.';
            return;
        }

        output.textContent = data.translation;
    } catch (error) {
        output.textContent = 'Error connecting to the translation service.';
        console.error(error);
    }
});
