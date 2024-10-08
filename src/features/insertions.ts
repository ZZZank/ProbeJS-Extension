import * as vscode from "vscode";
import { ProbeWebClient } from "../probe";
import { HighlightItem, toComponentString } from "../payload/highlightItems";
import { HighlighBlock, toPropertyString } from "../payload/highlightBlock";
import { SessionInfo } from "../payload/sessionInfo";

export function setupInsertions(probeClient: ProbeWebClient) {

    function acceptItem(data: HighlightItem[]) {
        let tabStop = 0;
        let dataString = data.map((item) => {
            let itemString = item.item.id;
            if (item.item.components) {
                let components = toComponentString(item);
                let componentStrings = components.map((comp, index, arr) => {
                    // escape } in the component string since it will be used in snippet
                    comp = comp.replace(/([}])/g, "\\$1");
                    let commaComp = index === arr.length - 1 ? comp : comp + ",";
                    return `\${${++tabStop}:${commaComp}}`;
                }).join("");
                itemString = `${item.item.id}\${${++tabStop}:[${componentStrings}]}`;
            }
            if (item.item.count > 1) {
                itemString = `${item.item.count}x ${itemString}`;
            }
            return itemString;
        });
        // enclose each item in single quotes
        dataString = dataString.map((str) => `'${str}'`);
        let snippetString = dataString.length === 1 ? dataString[0] : `[${dataString.join(", ")}]`;

        vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(snippetString));
    }

    function acceptBlock(data: HighlighBlock) {
        let dataString = data.id;
        if (Object.keys(data.properties).length > 0) {
            let properties = toPropertyString(data).map((prov, index, arr) => {
                // make it tabstop with default value
                let commaProv = index === arr.length - 1 ? prov : prov + ", ";
                return `\${${index + 1}:${commaProv}}`;
            }).join("");
            dataString += `\${0:[${properties}]}`;
        }
        dataString = `"${dataString}"`;
        vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(dataString));
    }

    probeClient.registerWSHandler("api/updates", async (event, data) => {
        if (event === "server/highlight/items") {
            acceptItem(data as HighlightItem[]);
        } else if (event === "server/highlight/block") {
            acceptBlock(data as HighlighBlock);
        }
    });
    probeClient.registerWSInitializer("api/updates", SessionInfo.asPayloadInitializer({ source: "probejs", tags: ["highlight"] }));
}