import * as vscode from 'vscode';
import { Collector } from './collectors';

export function activate(context: vscode.ExtensionContext) {
	let ws = vscode.workspace.workspaceFolders;
	if (!ws) { return; }
	let workspace = ws[0].uri;

	let attributesPath = workspace.with({ path: workspace.path + "/.vscode/item-attributes.json" });
	const collector = new Collector();
	collector.collect(attributesPath);

	collector.buildCompletions(workspace);
	const provider: vscode.CompletionItemProvider = {

		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			var trigger = document.getText(new vscode.Range(position.translate(0, -1), position));
			return collector.getItemCompletions().filter((item) => {
				if (typeof item.label === "string") {
					throw new Error("Item label should not be a string");
				}
				return item.label.label.startsWith(trigger);
			});
		}
	};

	// Should cover all languages that are used in the Minecraft modpack development
	let languages = ["javascript", "json", "zenscript", "plaintext", "toml", "yaml"];
	languages.forEach((lang) => {
		context.subscriptions.push(vscode.languages.registerHoverProvider(lang, {
			provideHover(document, position) {
				var range = document.getWordRangeAtPosition(position, /".+"/);
				if (!range) { return undefined; }
				var word = document.getText(range);
				// split the word by position of the cursor
				let wordFirst = word.substring(0, position.character - range.start.character);
				let wordSecond = word.substring(position.character - range.start.character);

				// find the last " in the first part, and the first " in the second part
				let first = wordFirst.lastIndexOf("\"");
				let second = wordSecond.indexOf("\"");

				// get the word between the two "
				word = wordFirst.substring(first + 1) + wordSecond.substring(0, second);

				// if the word is `{number}x {item}`, remove the number and the x
				if (word.match(/^\d+x /)) {
					word = word.substring(word.indexOf(" ") + 1);
				}

				// if ":" not in word, prefix with "minecraft:"
				if (!word.includes(":")) {
					word = "minecraft:" + word;
				}
				return collector.getHover(word, workspace);

			}
		}));
	});

	context.subscriptions.push(vscode.commands.registerCommand("probejs.reload", () => {
		collector.clear();
		collector.collect(attributesPath);
		collector.buildCompletions(workspace);
	}));
}

// This method is called when your extension is deactivated
export function deactivate() { }
