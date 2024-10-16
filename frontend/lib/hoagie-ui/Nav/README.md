Standard Nav
```ts
<Nav name="test" />
```

Nav with User Data
```ts
const user = {
    isLoading: false,
    user: {
        email: "hoagie@princeton.edu",
        name: "Tammy Tiger",
        nickname: "hoagie"
    },
};
<Nav name="test" user={user} />
```

Nav with Tabs + Beta Disclaimer
```ts
const tabs = [
    { title: 'Buy', href: '/buy' },
    { title: 'Sell', href: '/sell' },
    { title: 'My Purchases', href: '/profile' }
];
<Nav name="test" tabs={tabs} beta={true}/>
```