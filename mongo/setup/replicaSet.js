rsconf = {
    _id: 'rs0',
    members: [
        { _id: 0, host: "mongo-rs0-1:27017", name: 'mongo-rs0-1', state: 1, stateStr: "PRIMARY" },
        { _id: 1, host: "mongo-rs0-2:27017", name: 'mongo-rs0-2', state: 2, stateStr: "SECONDARY", syncingTo: 'mongo-rs0-1' },
        { _id: 2, host: "mongo-rs0-3:27017", name: 'mongo-rs0-3', state: 7, stateStr: "ARBITER" },
    ]
}

rs.initiate(rsconf)

rs.conf()