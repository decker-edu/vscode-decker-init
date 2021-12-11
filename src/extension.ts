import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {


	let disposable = vscode.commands.registerCommand('decker-init.create', (directory : vscode.Uri) => {
		if(!directory) {
			vscode.window.showErrorMessage("This command needs to be invoced from the explorer context menu.");
			vscode.window.showInputBox({title: "Please enter a name for your presentation.", ignoreFocusOut: true, placeHolder: "Presentation Name"}).then((input) => {
				if(!input) {
					vscode.window.showInformationMessage("Creation cancelled by user.");
				}
			}).then(() => {
				vscode.window.showInputBox({});
			});
			return;
		}
		let create : vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
		let yaml : string = path.join(directory.fsPath, "decker.yaml");
		let md : string = path.join(directory.fsPath, "rename-deck.md");
		let yamlUri = vscode.Uri.file(yaml);
		let mdUri = vscode.Uri.file(md);
		create.createFile(yamlUri, {overwrite: false});
		create.createFile(mdUri, {overwrite: false});
		vscode.workspace.applyEdit(create).then((success) => {
			if(!success) {
				vscode.window.showErrorMessage(`Unable to create the neccessary files. Probably they already exist in the chosen directory.`);
			} else {
				vscode.window.showInformationMessage(`Initialized decker presentation in ${directory.fsPath}`);
				let contents : vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
				contents.insert(yamlUri, new vscode.Position(0,0), yamlTemplate, undefined);
				contents.insert(mdUri, new vscode.Position(0,0), mdTemplate, undefined);
		
				vscode.workspace.applyEdit(contents).then((success) => {
					if(!success) {
						vscode.window.showErrorMessage(`Error while filling created files with content.`);
					}
				}, (error) => {
					console.error(error);
				});
			}
		});
	});

	context.subscriptions.push(disposable);
}

const yamlTemplate : string = String.raw
`resource-pack: exe:decker

reveal:
  width: 1280
  height: 720

explain:
  recWidth: 1920
  recHeight: 1080
  camWidth: 1280
  camHeight: 720
  useGreenScreen: false

feedback:
  server: "https://tramberend.bht-berlin.de/decker"

lang: de

exclude-directories:
- public

`;

const mdTemplate : string = String.raw
`---
title:        Deck Title
subtitle:     Optional Subtitle (delete this line if you do not want one)
author:       Author Name
affiliation:  Optional Affilation Name (delete this line if you have no affilation)
feedback:
  deck-id:  'unique-id'
...

# First Slide
`;

export function deactivate() {}
