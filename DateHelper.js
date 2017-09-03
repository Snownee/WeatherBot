function resolve(entities) {
    let set = new Set(), now = this.getNow();
    for (let e of entities) {
        console.log(1);
        
        // LUIS目前的问题，给出'X月X日'，第一Entitiy为去年的X月X日
        e = e.resolution.values.find( element => {
            switch (element.type) {
            case 'date':
                return (new Date(element.value) > (now - 15552000000)) && (new Date(element.value) < (+now + 15552000000));
                break;
            case 'daterange':
                return (new Date(element.start) > (now - 15552000000)) && (new Date(element.end) < (+now + 15552000000));
                break;
            }
        } );
        console.log(JSON.stringify(e, null, 4));
        if (!e)
            continue;
        
        switch (e.type) {
            case 'date':
                set.add(new Date(e.value));
                break;
            case 'daterange':
                let end = new Date(e.end);
                for (let date = new Date(e.start);date <= end;date = +date + 86400000) {
                    set.add(+date);
                }
                break;
        }
    }
    console.log(set);
    let ret = [];
    for (let i of set) {
        ret.push(parseInt((i - now) / 86400000));
    }
    return ret;
}

function getNow() {
    let d = new Date();
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
}

module.exports = {
    resolve: resolve,
    getNow: getNow
};

/*
[
    {
        "entity": "今天",
        "type": "builtin.datetimeV2.date",
        "startIndex": 0,
        "endIndex": 1,
        "resolution": {
            "values": [
                {
                    "timex": "2017-09-02",
                    "type": "date",
                    "value": "2017-09-02"
                }
            ]
        }
    },
    {
        "entity": "明天",
        "type": "builtin.datetimeV2.date",
        "startIndex": 3,
        "endIndex": 4,
        "resolution": {
            "values": [
                {
                    "timex": "2017-09-03",
                    "type": "date",
                    "value": "2017-09-03"
                }
            ]
        }
    }
]
*/