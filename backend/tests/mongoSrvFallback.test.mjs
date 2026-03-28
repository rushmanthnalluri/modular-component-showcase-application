import assert from "node:assert/strict";
import test from "node:test";
import {
    buildDirectMongoUri,
    connectMongoWithSrvFallback,
    parseTxtRecordData,
} from "../src/utils/mongoSrvFallback.js";

test("parseTxtRecordData joins quoted DNS TXT segments", () => {
    const record = "\"authSource=admin\" \"&replicaSet=atlas-abc-shard-0\"";
    assert.equal(parseTxtRecordData(record), "authSource=admin&replicaSet=atlas-abc-shard-0");
});

test("buildDirectMongoUri expands SRV answers into a standard MongoDB URI", () => {
    const mongoUri = "mongodb+srv://demo%40user:p%40ss@cluster0.example.mongodb.net/modularcomponent?retryWrites=true&w=majority&appName=Cluster0";
    const directUri = buildDirectMongoUri(
        mongoUri,
        [
            { data: "0 0 27017 shard-00-00.example.mongodb.net." },
            { data: "0 0 27017 shard-00-01.example.mongodb.net." },
        ],
        [{ data: "\"authSource=admin&replicaSet=atlas-abc-shard-0\"" }]
    );

    assert.equal(
        directUri,
        "mongodb://demo%40user:p%40ss@shard-00-00.example.mongodb.net:27017,shard-00-01.example.mongodb.net:27017/modularcomponent?retryWrites=true&w=majority&appName=Cluster0&authSource=admin&replicaSet=atlas-abc-shard-0&tls=true"
    );
});

test("connectMongoWithSrvFallback retries with a direct-host URI after SRV resolution fails", async () => {
    const attemptedUris = [];
    const mongoUri = "mongodb+srv://demo:secret@cluster0.example.mongodb.net/modularcomponent?retryWrites=true&w=majority";

    async function mockConnect(uri) {
        attemptedUris.push(uri);

        if (uri.startsWith("mongodb+srv://")) {
            const error = new Error("querySrv ECONNREFUSED _mongodb._tcp.cluster0.example.mongodb.net");
            throw error;
        }
    }

    async function mockFetch(url) {
        if (url.includes("type=SRV")) {
            return {
                ok: true,
                async json() {
                    return {
                        Status: 0,
                        Answer: [
                            { data: "0 0 27017 shard-00-00.example.mongodb.net." },
                            { data: "0 0 27017 shard-00-01.example.mongodb.net." },
                        ],
                    };
                },
            };
        }

        return {
            ok: true,
            async json() {
                return {
                    Status: 0,
                    Answer: [{ data: "\"authSource=admin&replicaSet=atlas-abc-shard-0\"" }],
                };
            },
        };
    }

    const result = await connectMongoWithSrvFallback({
        mongoUri,
        connect: mockConnect,
        connectOptions: { serverSelectionTimeoutMS: 10000 },
        fetchImpl: mockFetch,
    });

    assert.equal(result.usedSrvFallback, true);
    assert.equal(attemptedUris.length, 2);
    assert.equal(attemptedUris[0], mongoUri);
    assert.match(attemptedUris[1], /^mongodb:\/\/demo:secret@shard-00-00\.example\.mongodb\.net:27017,shard-00-01\.example\.mongodb\.net:27017\/modularcomponent\?/);
    assert.equal(result.connectionUri, attemptedUris[1]);
});
