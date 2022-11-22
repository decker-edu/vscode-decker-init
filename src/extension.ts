import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

declare interface TemplateData {
    name: string,
    inputs: InputData[]
}

declare interface InputData {
    name: string,
    description: string,
    placeholder: string,
	required: boolean
}

function isUnset(thing : string | undefined) : boolean {
	if(!thing || thing === "") return true;
	return false;
}

export function activate(context: vscode.ExtensionContext) {

	let pick = vscode.commands.registerCommand('decker-init.pick', (directory : vscode.Uri) => {
		fs.readFile(context.extensionPath + "/res/templates.json", (err, data) => {
			if(err) {
				console.error(err);
			}
			let json = JSON.parse(data.toString());
			let templates = json.templates;
			let names = templates.map((item : TemplateData) => {
				return vscode.l10n.t(item.name);
			});
			vscode.window.showQuickPick(names).then(async (pick) => {
				if(!pick) {
					vscode.window.showInformationMessage(vscode.l10n.t("Template creation was cancelled by user."));
					return;
				}
				let choice = templates.find((item : TemplateData) => vscode.l10n.t(item.name) === pick);
				let inputs : InputData[] = choice.inputs;
				let map : Record<string, string> = {};
				for(const input of inputs) {
					let name : string = input.name;
					let description = vscode.l10n.t(input.description);
					let placeholder = vscode.l10n.t(input.placeholder);
					let userinput : string | undefined = await vscode.window.showInputBox({title: description, ignoreFocusOut: true, placeHolder: placeholder});
					if(isUnset(userinput)) {
						if(input.required) {
							map[name] = "undefined";
						} else {
							map[name] = "";
						}
					} else if(userinput) {
						map[name] = userinput;
					}
				}
				let files = choice.files;
				for(const file of files) {
					if(file.directory) {
						const dirname = fillPlaceholders(file.filename, map);
						const dirpath = path.join(directory.fsPath, dirname);
						if(!fs.existsSync(dirpath)) {
							fs.mkdirSync(dirpath);
						}
					} else {
						const filename = fillPlaceholders(file.filename, map);
						const sourcefile = path.join(context.extensionPath, "res", file.sourcefile);
						const destfile = path.join(directory.fsPath, filename);
						if(fs.existsSync(destfile)) {
							const answer = await vscode.window.showInformationMessage(vscode.l10n.t("{destfile} already exists. Overwrite?", {destfile}), {detail: vscode.l10n.t("Overwrite {destfile}?", {destfile}), modal: true}, vscode.l10n.t("Yes"), vscode.l10n.t("No"));
							if(!answer || answer === vscode.l10n.t("No")) {
								continue;
							}
						}
						fs.copyFileSync(sourcefile, destfile);
						const buffer = fs.readFileSync(destfile);
						const content = buffer.toString("utf-8");
						const replacement = fillPlaceholders(content, map);
						fs.writeFileSync(destfile, replacement);
					}
				}
			});
		});
	});

	context.subscriptions.push(pick);
}

function fillPlaceholders(str : string, map : Record<string, string>) : string {
	let result = str;
	for(const key in map) {
		result = result.replace(`\$\{${key}\}`, map[key]);
	}
	return result;
}

export function deactivate() {}
