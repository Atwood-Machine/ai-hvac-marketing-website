# Private Demo Form Setup

The public website does not display or contain the receiving email address.

## When the business inbox is ready

1. Create the intended inbox, such as `intake@aihvacmarketing.com`.
2. Create a Formspree form and choose that inbox as the recipient.
3. Formspree will provide an endpoint similar to:
   `https://formspree.io/f/abcdwxyz`
4. Open `script.js`.
5. Replace this line:

```js
const FORM_ENDPOINT = 'https://formspree.io/f/REPLACE_WITH_FORM_ID';
```

with the real endpoint:

```js
const FORM_ENDPOINT = 'https://formspree.io/f/abcdwxyz';
```

6. Commit and push the change. Render will redeploy automatically.

Because the recipient is configured inside Formspree, website visitors cannot see the private inbox address in the page or source code.
