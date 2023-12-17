

End-points: login,register

$ npm install
$ npm run start-auth
```
npm audit fix
```
```
POST http://localhost:8000/auth/login
POST http://localhost:8000/auth/register
```

```
{
   "access_token": "<ACCESS_TOKEN>"
}
```


send this authorization with any request to the protected endpoints

```
Authorization: Bearer <ACCESS_TOKEN>
```

