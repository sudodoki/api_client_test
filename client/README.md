This right now is a simple html with livereload snippet injected (search for 'document.write' bit) that has static content that might be used to create your SPA. There're also some js components installed via bower (see bower_components part).

1. Create router
2. Be able to sign-in/sign-up user: this requires doing POST request with request body being JSON object that has:
  + for sign-in: 'login', 'password' keys
  + for sign-up: 'login', 'password', 'passwordConfirmation', optional 'email' keys.
to API_URL + '/signin' & API_URL + '/signup'. Save retrieved token to use for further requests.
3. List all users, after querying API_URL + '/user'. Some might have gender specified, some - not, act accordingly, don't be confused, show avatars.
4. List single user, info on whom can be got queryin API_URL + '/user/' + user_id, given you're adding 'SECRET-TOKEN' header to request that you've gotten from sign-in/sign-up.
5. Edit profile info, using POST to API_URL + '/user/me'
6. Upload file to API_URL + '/user/me/avatar'. Can try using some [specific solutions](http://blueimp.github.io/jQuery-File-Upload/angularjs.html).
