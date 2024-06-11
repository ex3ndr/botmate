import { Axios } from "axios";
import { backoff } from "../../utils/time";
import { Schema, Update, Updates, sseUpdate } from "./schema";
import { sse } from "./sse";
import { SERVER_ENDPOINT } from "@/config";
import { Content, contentCodec } from "./content";
import { log } from "@/utils/logs";

export class BackendClient {

    readonly client: Axios
    readonly token: string;

    constructor(client: Axios, token: string) {
        this.client = client;
        this.token = token;
    }

    async fetchPreState() {
        let res = await this.client.get('/pre/state');
        return Schema.preState.parse(res.data);
    }

    preUsername(username: string) {
        return backoff(async () => {
            let res = await this.client.post('/pre/username', { username });
            return Schema.preUsername.parse(res.data);
        })
    }

    preName(firstName: string, lastName: string | null) {
        return backoff(async () => {
            let res = await this.client.post('/pre/name', { firstName, lastName });
            return Schema.preName.parse(res.data);
        })
    }

    preComplete() {
        return backoff(async () => {
            await this.client.post('/pre/complete');
        })
    }

    registerPushToken(token: string) {
        return backoff(async () => {
            await this.client.post('/app/register_push_token', { token });
        })
    }

    //
    // Updates
    //

    async getUpdatesSeq() {
        let res = await this.client.post('/app/updates/seq', {});
        return Schema.getSeq.parse(res.data).seq;
    }

    async getUpdatesDiff(seq: number) {
        let res = await this.client.post('/app/updates/diff', { after: seq });
        return Schema.getDiff.parse(res.data);
    }

    updates(handler: (seq: number, update: Update | null) => void) {
        return sse(`https://${SERVER_ENDPOINT}/app/updates`, this.token, (update) => {
            let parsed = sseUpdate.safeParse(JSON.parse(update));
            if (!parsed.success) {
                return;
            }
            if (parsed.data.data) {
                let parsedUpdate = Updates.safeParse(parsed.data.data);
                if (parsedUpdate.success) {
                    handler(parsed.data.seq, parsedUpdate.data);
                } else {
                    console.error('Failed to parse update:', JSON.parse(update));
                    handler(parsed.data.seq, null);
                }
            } else {
                log('UPD', 'Received last known seq:' + parsed.data.seq);
                handler(parsed.data.seq, null);
            }

        });
    }

    //
    // Secure
    //

    async accountDelete() {
        await this.client.post('/secure/delete', {});
    }

    async tokenAndAccountStatus() {
        let res = await this.client.post('/secure/status', {});
        return Schema.accountStatus.parse(res.data).ok;
    }

    //
    // Profile
    //

    async me() {
        let res = await this.client.post('/app/me', {});
        return Schema.me.parse(res.data).profile;
    }

    async users(ids: string[]) {
        let res = await this.client.post('/app/users', { ids });
        return Schema.users.parse(res.data).users;
    }

    async uploadVoiceSample(sample: string) {
        await this.client.post('/app/profile/edit/voice', { sample });
    }

    async reportFirstPaired(vendor: string) {
        let res = await this.client.post('/app/report/paired', { vendor });
        Schema.ok.parse(res.data);
    }

    async reportFirstVoiced(vendor: string) {
        let res = await this.client.post('/app/report/voiced', { vendor });
        Schema.ok.parse(res.data);
    }

    //
    // Developer
    //

    async updateDeveloperMode(enable: boolean) {
        let res = await this.client.post('/app/profile/edit/developer', { enable });
        Schema.ok.parse(res.data);
    }

    async personalTokens() {
        let res = await this.client.post('/app/dev/tokens', {});
        return Schema.tokens.parse(res.data).tokens;
    }

    async createPersonalToken() {
        let res = await this.client.post('/app/dev/tokens/create', {});
        return Schema.tokenCreate.parse(res.data).token;
    }

    async deletePersonalToken(id: string) {
        let res = await this.client.post('/app/dev/tokens/delete', { id });
        Schema.ok.parse(res.data);
    }

    //
    // Memories
    //

    async memories(ids: string[]) {
        let res = await this.client.post('/app/memories', { ids });
        return Schema.listMemories.parse(res.data).memories;
    }

    //
    // Feed
    //

    async getFeedSeq() {
        let res = await this.client.post('/app/feed/state', {});
        return Schema.feedState.parse(res.data).seqno;
    }

    async getFeedList(args: { source: string, before: number | null, after: number | null }) {
        let res = await this.client.post('/app/feed/list', args);
        let parsed = Schema.feedList.parse(res.data);
        let items: { seq: number, date: number, by: string, content: Content }[] = [];
        for (let i of parsed.items) {
            let content = contentCodec.parse(i.content);
            items.push({ seq: i.seq, date: i.date, by: i.by, content });
        }
        return {
            items,
            next: parsed.next
        }
    }
}