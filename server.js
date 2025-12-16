require('dotenv').config({ debug: true });
let express = require('express');
let cors = require('cors');
var admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
const allowedOrigins = [
    'https://bookbank789.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // (error, allow)
        } else {
            callback(new Error('Not allowed by CORS')); // ခွင့်မပြုပါ
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

var cer = {
    "type": "service_account",
    "project_id": process.env.PROJECTID,
    "private_key_id": process.env.PRIVATEKEYID,
    "private_key": process.env.PRIVATEKEY,
    "client_email": process.env.CLIENTEMAIL,
    "client_id": process.env.CLIENTID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": process.env.CLIENTCERT,
    "universe_domain": "googleapis.com"
}
//initialize firebase admin
admin.initializeApp({
    credential: admin.credential.cert(cer)
});
const db = admin.firestore();

//map for encrypt and decrypt dictionary
let en_data = {
    'a': '8n', 'b': '37', 'c': 'Q8', 'd': 'zT', 'e': '1Z', 'f': '2Y', 'g': 'pj', 'h': '9wt', 'i': 'kz', 'j': '3s', 'k': 'rX', 'l': 'zb', 'm': 'sE', 'n': 'Mg', 'o': 'Ke', 'p': 'hP', 'q': 'nE', 'r': 'yB', 's': 'Pw', 't': 'xq', 'u': 'uT', 'v': '6v', 'w': 'T7', 'x': 'yI', 'y': 'CmW', 'z': 'R1',
    '0': 'Tk', '1': 'kV', '2': 'Bw', '3': 'zP', '4': 'Yo', '5': '4c', '6': 'Ar', '7': 'Dm', '8': 'U7', '9': 'Fw', ' ': 'qN', '.': 'vi', ',': 'Pq', ':': '3E'
}
const de_data = {};
for (const [key, value] of Object.entries(en_data)) {
    de_data[value] = key;
}
//encrypt function
function encrypt(e) {
    let encrypted = '';
    const normalizedText = e.toLowerCase();
    for (const char of normalizedText) {
        const substitution = en_data[char];
        if (substitution) {
            encrypted += substitution + 'a';
        } else {
            encrypted += char
        }
    }
    return encrypted.endsWith('a') ? encrypted.slice(0, -'a'.length) : encrypted
}
//decrypt function
function decrypt(e) {
    let text = '';
    const encrypt = e.split('a');
    for (const char of encrypt) {
        const origin = de_data[char];
        if (origin) {
            text += origin;
        } else {
            text += char
        }
    }
    return text
}
//generate student key
function generatekey(e) {
    let stringnum = String(e);
    let splitstring = stringnum.split('');
    let reversedstring = splitstring.reverse();
    let joinedstring = reversedstring.join('');
    let res = encrypt(joinedstring);
    return res;
}
//generate time
function getdate(e) {
    let jsdate = e.toDate();
    const formattedDate = jsdate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return formattedDate;
}

const limiter = rateLimit({
    windowMs: 1 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Server can request 3 times per second, try again later!'
});
app.use(limiter);

app.get('/', (req, res) => {
    res.send('Welcome')
})

//add new book
app.post('/api/new/book', async (req, res) => {
    let recv = req.body;
    if (recv) {
        try {
            await db.collection('book').add({
                name: recv.name,
                author: recv.author,
                authorid: recv.authorid,
                cate: recv.cate,
                type: recv.type,
                des: recv.des,
                page: recv.page,
                size: recv.size,
                thumb: recv.thumb,
                link: recv.link,
                time: admin.firestore.FieldValue.serverTimestamp(),
            }).then(() => {
                res.json({
                    status: 'success',
                    text: 'New book was added.',
                    data: []
                })
            }).catch(error => {
                res.json({
                    status: 'fail',
                    text: 'Something went wrong while adding new book!',
                    data: []
                })
            })
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to add new book!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Something went wrong!',
            data: []
        })
    }
})
//get all book
app.get('/api/all/book', async (req, res) => {
    try {
        let got = await db.collection('book').get();
        let list = got.docs.map(d => ({
            id: d.id,
            date: getdate(d.data().time),
            ...d.data()
        }))
        res.json({
            status: 'success',
            text: 'Books were got.',
            data: list
        })
    } catch (e) {
        res.json({
            status: 'fail',
            text: 'Something went wrong to get book data!',
            data: []
        })
    }
})
//update book data
app.post('/api/update/book', async (req, res) => {
    let recv = req.body;
    if (recv) {
        try {
            await db.collection('book').doc(recv.id).update({
                name: recv.name,
                author: recv.author,
                authorid: recv.authorid,
                cate: recv.cate,
                type: recv.type,
                des: recv.des,
                page: recv.page,
                size: recv.size,
                thumb: recv.thumb,
                link: recv.link,
            }).then(() => {
                res.json({
                    status: 'success',
                    text: 'Update book successfully.',
                    data: []
                })
            }).catch(error => {
                res.json({
                    status: 'fail',
                    text: 'Something went wrong while updating book data!',
                    data: []
                })
            })
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to update book data!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Something went wrong!',
            data: []
        })
    }
})
//get specific book
app.get('/api/book/:bid', async (req, res) => {
    let { bid } = req.params;
    if (bid) {
        try {
            let got = await db.collection('book').doc(bid).get();
            if (got.exists) {
                let da = {
                    id: got.id,
                    date: getdate(got.data().time),
                    ...got.data()
                }
                res.json({
                    status: 'success',
                    text: 'Books was got.',
                    data: da
                })
            } else {
                res.json({
                    status: 'fail',
                    text: 'No book found with this ID!',
                    data: []
                })
            }
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to get book data!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Book ID was required!',
            data: []
        })
    }
})

//add new author
app.post('/api/new/author', async (req, res) => {
    let recv = req.body;
    if (recv) {
        try {
            await db.collection('author').add({
                name: recv.name,
                email: recv.email,
                birth: recv.birth,
                address: recv.address,
                wiki: recv.wiki,
                profile: recv.profile,
                about: recv.about,
                country: recv.country,
                time: admin.firestore.FieldValue.serverTimestamp(),
            }).then(() => {
                res.json({
                    status: 'success',
                    text: 'New author was added.',
                    data: []
                })
            }).catch(error => {
                res.json({
                    status: 'fail',
                    text: 'Something went wrong while adding new author!',
                    data: []
                })
            })
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to add new author!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Something went wrong!',
            data: []
        })
    }
})
//get all author
app.get('/api/all/author', async (req, res) => {
    try {
        let got = await db.collection('author').get();
        let list = got.docs.map(d => ({
            id: d.id,
            date: getdate(d.data().time),
            ...d.data()
        }))
        res.json({
            status: 'success',
            text: 'Authors were got.',
            data: list
        })
    } catch (e) {
        res.json({
            status: 'fail',
            text: 'Something went wrong to get author data!',
            data: []
        })
    }
})
//update author data
app.post('/api/update/author', async (req, res) => {
    let recv = req.body;
    if (recv) {
        try {
            await db.collection('author').doc(recv.id).update({
                name: recv.name,
                email: recv.email,
                birth: recv.birth,
                address: recv.address,
                wiki: recv.wiki,
                profile: recv.profile,
                about: recv.about,
                country: recv.country
            }).then(() => {
                res.json({
                    status: 'success',
                    text: 'Update author successfully.',
                    data: []
                })
            }).catch(error => {
                res.json({
                    status: 'fail',
                    text: 'Something went wrong while updating author data!',
                    data: []
                })
            })
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to update author data!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Something went wrong!',
            data: []
        })
    }
})

//get specific author
app.get('/api/author/:aid', async (req, res) => {
    let { aid } = req.params;
    if (aid) {
        try {
            let got = await db.collection('author').doc(aid).get();
            if (got.exists) {
                let da = {
                    id: got.id,
                    date: getdate(got.data().time),
                    ...got.data()
                }
                res.json({
                    status: 'success',
                    text: 'Author was got.',
                    data: da
                })
            } else {
                res.json({
                    status: 'fail',
                    text: 'No author found with this ID!',
                    data: []
                })
            }
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to get author data!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Author ID was required!',
            data: []
        })
    }
})

//check is admin
app.get('/api/isadmin', async (req, res) => {
    let { uid, email } = req.query;
    if (uid && email) {
        try {
            let got = await db.collection('author').where('uid', '==', uid).where('email', '==', email).get();
            if (!got.empty) {
                let da = {
                    id: got.id,
                    date: getdate(got.data().time),
                    ...got.data()
                }
                res.json({
                    status: 'success',
                    text: 'Author was got.',
                    data: da
                })
            } else {
                res.json({
                    status: 'fail',
                    text: 'No admin found with this user ID and email!',
                    data: []
                })
            }
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to get author data!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'User ID and email required!',
            data: []
        })
    }
})

//request new member
app.post('/api/request/member', async (req, res) => {
    let recv = req.body;
    if (recv) {
        try {
            await db.collection('requestmember').add({
                name: recv.name,
                email: recv.email,
                uid: recv.uid,
                status: 'requested',
                time: admin.firestore.FieldValue.serverTimestamp(),
            }).then(() => {
                res.json({
                    status: 'success',
                    text: 'New member was requested.',
                    data: []
                })
            }).catch(error => {
                res.json({
                    status: 'fail',
                    text: 'Something went wrong while requesting to new member!',
                    data: []
                })
            })
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to request new member!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Something went wrong!',
            data: []
        })
    }
})
//reject member request
app.post('/api/reject/request/member', async (req, res) => {
    let recv = req.body;
    if (recv) {
        try {
            await db.collection('requestmember').doc(recv.id).update({
                status: 'rejected',
                time: admin.firestore.FieldValue.serverTimestamp(),
            }).then(() => {
                res.json({
                    status: 'success',
                    text: 'New member was rejected.',
                    data: []
                })
            }).catch(error => {
                res.json({
                    status: 'fail',
                    text: 'Something went wrong while rejecting to new member!',
                    data: []
                })
            })
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to reject new member!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Something went wrong!',
            data: []
        })
    }
})
//accept member request
app.post('/api/accept/request/member', async (req, res) => {
    let recv = req.body;
    if (recv) {
        try {
            await db.collection('member').doc(recv.uid).set({
                name: recv.name,
                email: recv.email,
                uid: recv.uid,
                time: admin.firestore.FieldValue.serverTimestamp(),
            }).then(async () => {
                await db.collection('requestmember').doc(recv.id).update({
                    status: 'accepted',
                }).then(() => {
                    res.json({
                        status: 'success',
                        text: 'New member was accepted.',
                        data: []
                    })
                }).catch(error => {
                    res.json({
                        status: 'fail',
                        text: 'Something went wrong while accepting to new member!',
                        data: []
                    })
                })
            })
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to accept new member!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Something went wrong!',
            data: []
        })
    }
})
//add new member
app.post('/api/new/member', async (req, res) => {
    let recv = req.body;
    if (recv) {
        try {
            await db.collection('member').doc(recv.uid).set({
                name: recv.name,
                email: recv.email,
                uid: recv.uid,
                time: admin.firestore.FieldValue.serverTimestamp(),
            }).then(() => {
                res.json({
                    status: 'success',
                    text: 'New member was added.',
                    data: []
                })
            }).catch(error => {
                res.json({
                    status: 'fail',
                    text: 'Something went wrong while adding new member!',
                    data: []
                })
            })
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to add new member!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Something went wrong!',
            data: []
        })
    }
})
//get all member
app.get('/api/all/member', async (req, res) => {
    try {
        let got = await db.collection('member').get();
        let list = got.docs.map(d => ({
            id: d.id,
            date: getdate(d.data().time),
            ...d.data()
        }))
        res.json({
            status: 'success',
            text: 'Members were got.',
            data: list
        })
    } catch (e) {
        res.json({
            status: 'fail',
            text: 'Something went wrong to get member data!',
            data: []
        })
    }
})
//get all request member
app.get('/api/all/requestmember', async (req, res) => {
    try {
        let got = await db.collection('requestmember').get();
        let list = got.docs.map(d => ({
            id: d.id,
            date: getdate(d.data().time),
            ...d.data()
        }))
        res.json({
            status: 'success',
            text: 'Member requests were got.',
            data: list
        })
    } catch (e) {
        res.json({
            status: 'fail',
            text: 'Something went wrong to get member requests data!',
            data: []
        })
    }
})
//update member data
app.post('/api/update/member', async (req, res) => {
    let recv = req.body;
    if (recv) {
        try {
            await db.collection('member').doc(recv.id).update({
                name: recv.name,
                email: recv.email,
                uid: recv.uid,
            }).then(() => {
                res.json({
                    status: 'success',
                    text: 'Update member successfully.',
                    data: []
                })
            }).catch(error => {
                res.json({
                    status: 'fail',
                    text: 'Something went wrong while updating member data!',
                    data: []
                })
            })
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to update member data!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Something went wrong!',
            data: []
        })
    }
})
//check is member
app.get('/api/ismember', async (req, res) => {
    let { uid, email } = req.query;
    if (uid && email) {
        try {
            let got = await db.collection('member').doc(uid).get();
            if (got.exists) {
                let data = got.data();
                if (uid === data.uid && email === data.email) {
                    let da = {
                        id: got.id,
                        date: getdate(got.data().time),
                        ...got.data()
                    }
                    res.json({
                        status: 'success',
                        text: 'Member was got.',
                        data: da
                    })
                } else {
                    res.json({
                        status: 'fail',
                        text: 'No member found with this user ID and email!',
                        data: []
                    })
                }
            } else {
                res.json({
                    status: 'fail',
                    text: 'No member found with this user ID and email!',
                    data: []
                })
            }
        } catch (e) {
            res.json({
                status: 'fail',
                text: 'Something went wrong to get member data!',
                data: []
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'User ID and email required!',
            data: []
        })
    }
})

app.listen(80, () => {
    console.log('server started with port 80');
})