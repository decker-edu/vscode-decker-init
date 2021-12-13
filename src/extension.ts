import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {

	let pick = vscode.commands.registerCommand('decker-init.pick', (directory : vscode.Uri) => {
		fs.readFile(context.extensionPath + "/res/templates.json", (err, data) => {
			if(err) {
				console.error(err);
			}
			let json = JSON.parse(data.toString());
			let templates = json.templates;
			let names = templates.map((item : any) => item.name);
			vscode.window.showQuickPick(names).then(async (pick) => {
				if(!pick) {
					vscode.window.showInformationMessage("Template creation was cancelled by user.");
					return;
				}
				let choice = templates.find((item : any) => item.name === pick);
				let inputs = choice.inputs;
				let map : Record<string, string> = {};
				for(const input of inputs) {
					let name : string = input.name;
					let description = input.description;
					let placeholder = input.placeholder;
					let userinput : string | undefined = await vscode.window.showInputBox({title: description, ignoreFocusOut: true, placeHolder: placeholder});
					if(!userinput) {
						continue;	
					}
					map[name] = userinput;
				}
				let files = choice.files;
				let create : vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
				for(let i = 0; i < files.length; i++) {
					let filename : string = files[i].filename;
					filename = fillPlaceholders(filename, map);
					let filepath = path.join(directory.fsPath, filename);
					let uri = vscode.Uri.file(filepath);
					create.createFile(uri, {overwrite: false});
				}
				vscode.workspace.applyEdit(create).then((success) => {
					if(!success) {
						vscode.window.showErrorMessage("Can not create all necessary files for this template.");
						return;
					}
					let inserts : vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
					for(let i = 0; i < files.length ; i++) {
						let filename : string = files[i].filename;
						filename = fillPlaceholders(filename, map);
						let filepath = path.join(directory.fsPath, filename);
						let uri = vscode.Uri.file(filepath);
						let contents : string = files[i].contents;
						contents = fillPlaceholders(contents, map);
						inserts.insert(uri, new vscode.Position(0,0), contents);
					}
					vscode.workspace.applyEdit(inserts).then((success) => {
						if(!success) {
							vscode.window.showErrorMessage("Can not fill the created files with content.");
							return;
						}
					});
				});
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
