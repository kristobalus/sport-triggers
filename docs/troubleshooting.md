

### Troubleshooting guide


#### Search for triggers inside question
use Triggers/ListTriggers by entity
```json
{
    "entity": "question",
    "entity_id": "77177"
}
```
to search for triggers created within question/moderation.


#### Inspect trigger of interest via http endpoint

Use HTTP endpoints to get full log of events absorbed by trigger.

```text
POST /studio/trigger/get HTTP/1.1
x-access-token: cNZ8SaZQWukJEpWV3C7Sq5XYCRvp89uK
x-signature: HfT1wdzQXO9t1fv9aGBpdDEwz3R7wU+SsDDz5bqGkW0=
Content-Type: application/json
User-Agent: PostmanRuntime/7.38.0
Accept: */*
Postman-Token: c42772ae-8844-4939-8c11-7002d0df45e1
Host: triggers.next.streamlayer.io
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Content-Length: 74
 
{
"id": "93e97941-5b0a-4c9c-87fc-48d868b646d9",
"options": "log"
}
 
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
cache-control: no-cache
vary: accept-encoding
content-encoding: gzip
date: Tue, 07 May 2024 05:54:36 GMT
via: 1.1 google
Alt-Svc: h3=":443"; ma=2592000,h3-29=":443"; ma=2592000
Transfer-Encoding: chunked
 
```

use Postman pre-request script to sign the request
```js
console.log(pm.request.body.raw);
const secret = "lbFQ90hy620l2jU5w3s5bJesgYBp2MoOLJVT4l6OmxxPb84W4PgV3uI1Blx6Lnpo";
const digest = CryptoJS.HmacSHA256(pm.request.body.raw, secret).toString(CryptoJS.enc.Base64)
console.log("digest", digest);
pm.environment.set("digest", digest);
```

Trigger in response contains logs of events absorbed by trigger conditions.
```json
{
    "data": {
        "id": "93e97941-5b0a-4c9c-87fc-48d868b646d9",
        "type": "trigger",
        "attributes": {
            "trigger": {
                "name": "Trigger",
                "description": "Trigger description",
                "datasource": "nvenue",
                "scope": "game",
                "scopeId": "60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206",
                "entity": "question",
                "entityId": "77177",
                "sport": "baseball",
                "useLimits": true,
                "id": "93e97941-5b0a-4c9c-87fc-48d868b646d9",
                "disabledEntity": false,
                "next": false,
                "activated": false,
                "disabled": false,
                "useConditionThreshold": false
            },
            "conditions": [
                {
                    "targets": [
                        "SD"
                    ],
                    "sport": "baseball",
                    "activated": false,
                    "options": [
                        {
                            "targets": [
                                "strike_swinging"
                            ],
                            "event": "baseball.pitch.outcomes",
                            "compare": "in",
                            "type": "string"
                        },
                        {
                            "event": "baseball.team.pitcher",
                            "compare": "in",
                            "targets": [
                                "SD"
                            ],
                            "type": "string"
                        }
                    ],
                    "event": "baseball.team.pitcher",
                    "compare": "in",
                    "id": "132215e5-9cd4-419f-8a5e-0384eaa3ea3b",
                    "chainOperation": "and",
                    "uri": [
                        "nvenue/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/baseball.pitch.outcomes",
                        "nvenue/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/baseball.team.pitcher"
                    ],
                    "datasource": "nvenue",
                    "log": [
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/dW3jcLoKQ17JtftY-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/iKH4NNJrRYaMTiIK-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/NVJnxCFRd09zf2I8-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/AUMzKlk5Nmncprcn-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/rGZuPZVFRgIcYPjM-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/2UiNnjIk0wxY09SE-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/E3J8FYP85K405HPI-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/lmLV9GGnMyorj7hs-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/n29qhOYwEHV2BaWH-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/KXw6AuCTWVjbCoGF-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/W2Ws6Zxm3IV66qCh-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/bJb1kI4rBFQJuEm6-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/TeCSF9RfI3Vttdci-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/sCpG60PNe8SgKAPU-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/fg2KVDYw3oFhNSzV-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/ePQNd4KxdpveuiTR-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/O1Xdrz80oPk2WTCX-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/CyUrNrgUWM3Od0h9-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/iFHqLrFuYTr9VVms-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/l5hpSIb6BmyibVlf-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/QY9Tp6ACtMqErKbd-20240206"
                    ]
                },
                {
                    "targets": [
                        "5"
                    ],
                    "sport": "baseball",
                    "activated": false,
                    "options": [
                        {
                            "event": "baseball.inningNumber",
                            "compare": "eq",
                            "targets": [
                                "5"
                            ],
                            "type": "number"
                        }
                    ],
                    "event": "baseball.inningNumber",
                    "compare": "eq",
                    "id": "6c452dad-d5fd-422d-a6b8-4d75daac5e94",
                    "chainOperation": "and",
                    "uri": [
                        "nvenue/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/baseball.inningNumber"
                    ],
                    "datasource": "nvenue",
                    "log": [
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/Dy6E2pZkOK65LNuf-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/COZnpekY7MzvHao3-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/DitPmhj2nERJU6rI-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/6oGRBVCCTevSQf51-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/dW3jcLoKQ17JtftY-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/iKH4NNJrRYaMTiIK-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/EQbUEIA7miaoHGU6-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/YXDq1qqJ7jyqhfgg-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/pGJOmE6tKX7F3sv1-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/bxbRYiHKzs7cQ4Of-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/qT4CDKTi3u5U0WvO-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/cx7gJCKC0iAW4Xf1-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/NVJnxCFRd09zf2I8-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/4qVkYGQZlsMhPUSJ-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/Iemnojj8gzrh41aI-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/wQpPlHxzqqIvP23e-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/cU9PI3jWEs0n2WbV-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/TPRhLpgHGkLRAkbQ-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/9eOqyoJkWWnCMY9M-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/P3Nk9DDGakvX4Ipc-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/8x78bPbylDDAbruS-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/cijWg7OGi3cMYCzY-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/3XwSkIMyHyZGtJZ1-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/4YuonHy0fia5ZBVw-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/Legt0eaHWLEUsVQV-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/MxOMPHIESZpsJT0G-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/7dYrHFxCpG5FaJ3V-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/AUMzKlk5Nmncprcn-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/IHHvoufM801XHic4-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/GngsyS7SD7Dz0IFl-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/q0BK9Nc8QvZxDxgW-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/4mYFbFquN1FDPqwp-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/Qvv7V3II9M8qbUOU-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/zSezoEHRktd8qeDi-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/4XMjK5cBrCp0l22Q-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/ye7zGVtLAFaUowHK-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/RRGXIWuGnP8Y3ZTc-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/830Hfse2I8mOwon9-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/T6U3OVjyr4mtT8mn-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/HS21wTjd6JbiFqFZ-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/rGZuPZVFRgIcYPjM-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/3mecZjfb7abAP58I-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/lg93ITdNMPcKiMGC-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/iQUaJwNAVw27cQry-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/tLwoSmXODnrePDtb-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/tU63lM3AqHqgcFEU-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/xzFGKpPnWrxyEWk3-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/2UiNnjIk0wxY09SE-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/E3J8FYP85K405HPI-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/WfJsgDtfUzerLjYg-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/kNRtK39zNbndt152-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/Fm8qBEfYwB0Wm3s7-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/o5wsRwamZHDdivO7-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/axecDrYPvfyKujsC-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/1Lh0bIHTzHIvyMsQ-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/B03vz49gIK6CIIm5-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/5kA4KDSfpkcm4bh8-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/MX2GlBvAiBkGirmp-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/g9V4rTwAJVERzISY-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/lmLV9GGnMyorj7hs-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/n29qhOYwEHV2BaWH-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/Q4t7gAt2pVsfjDAw-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/RnC2ucQpPZplgWfd-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/MXuDS28vcqghGEqx-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/dtlbT5wAsaiz7J4R-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/2ekrA0dZsQdaBZW7-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/N0rRNNtXqKIoGwJt-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/n8tLqK0IPEqbR4ee-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/YSJmgtMbCEKUPp0j-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/bLKi7PD7MgWIPC2g-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/KXw6AuCTWVjbCoGF-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/W2Ws6Zxm3IV66qCh-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/RvNUkWGuSm6mADTk-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/WBNPGNlgQyKsLRv2-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/Psct2pdWYPuG53Os-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/gPESTleg8YGxXdxT-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/z21SZPbNDVevOqX8-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/HiE0gFNHyOA1rP2G-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/fmLiJobVePWgLLzX-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/it7m7KEgnhHqC2pX-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/2xOdABkX6oqTthxn-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/bJb1kI4rBFQJuEm6-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/vsk8n1Qdv1flVWz6-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/YjhTo43KxxCFo1JO-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/lYVaeBhm2QxOgh5w-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/33sXS9EzhhKlARNj-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/FCzxeu1Dv1qR2CZ8-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/Bho7hDBWedHsgkxC-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/YsQWKbbRiziODsL3-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/Cmxf8AhSE6QP7nMq-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/TRTVuQNRsu69Jkpo-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/KwL48maVOhJDWSTc-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/AN9MrlerBNZEnvWj-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/TeCSF9RfI3Vttdci-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/FUQlgMbiMSNssT7Q-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/f7M9rzuJE1kEAvTD-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/8PgaVmYzbfTkx2is-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/sY8g5MtlTPaDlL15-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/xAOFFXRaD8yEpUFK-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/6WTbQcTccpjWkuiv-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/RknG193eek7L6f6q-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/naW15G24FwMCkbsK-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/cxapzH6F6e1SVfVx-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/RoStttL5rkTYdTLe-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/dXQSFeVqOZOhAVE6-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/8iU1KwT6uSPD16X2-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/zUaHbJoMBibkDpyg-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/BT6ZhnOOID9fqvER-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/QSa5VH8xuUx6GfYu-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/sCpG60PNe8SgKAPU-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/fg2KVDYw3oFhNSzV-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/I3Rl7MVRtfMT9ayc-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/gkNUlYhQ0hguOYWT-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/hVaScpNnn4I4ynhM-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/HAhbh5ygFLkNK0un-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/6H7rVDVISsI5fpQJ-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/80xrclkiTrvlOtjl-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/yrXIKi12wpqcZs90-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/lWvtDYMUZPI8eUyY-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/LmgscPbB58urNrnI-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/ePQNd4KxdpveuiTR-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/O1Xdrz80oPk2WTCX-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/5wZiM2pm2MfFGQpy-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/cLz9sbb71yfVxPZI-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/ux8q7yTEMq82Xj9q-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/CknB4nTocTQvFlyD-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/mYat8rxXgmKZzarT-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/F9npnp0ijnhVE7uJ-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/6A4oh2ZAadGUvFnL-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/rOV1gTJYoIyzTeCt-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/KbOr3FTj5KQI7jKc-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/yUIQpEH0XaspVENI-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/JzwQhLsSqTW1WMQU-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/RGbXairIdQAjaW2M-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/gp8AZZ3KZhoDGuzm-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/CyUrNrgUWM3Od0h9-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/AxtlxcxyDnEayat9-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/VEwrqW4ZbB2kgST7-20240206",
                        "json/nvenue/baseball/game/60a02f0f-5429-4b14-975e-0b813f5a9bf0-20240206/snapshots/ycMkFjNIKSrG3OFy-20240206"
                    ]
                }
            ],
            "limits": {
                "scope": 1
            },
            "counts": {
                "scope": 1,
                "baseball.inningHalf/top": 1,
                "baseball.inningNumber/5": 1,
                "minute": null
            }
        }
    }
}
```

#### Search for trigger logs in axiom

check for trigger processing logs
```text
['staging-vector']
| where container_name == "triggers" and triggerId  == "009b5568-565f-47e5-b2c2-9aab90aa0578"
```

#### Search for trigger activation event
check if trigger was activated or not
```text
['staging-vector']
| where container_name == "polls" and msg contains "question triggered" and questionId == 77285
```

#### Search for notification sent to poll
```text
['staging-vector']
| where container_name == "triggers" and msg contains "subscription sent" and subscription contains "77272"
```

#### Search for trigger create request by question id
```text
['staging-vector']
| where container_name contains "trigger" and msg contains "create trigger" and trigger contains "90288"
```
