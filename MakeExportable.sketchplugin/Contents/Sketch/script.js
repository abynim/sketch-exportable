var kPluginDomain = "com.abynim.sketchplugins.exportable";
var kSavedPresetsKey = "com.abynim.sketchplugins.savedPresets";

var iconImage;

var saveAsPreset = function(context) {

	parseContext(context);

	var layer = context.selection.firstObject();
	if (!layer) {
		showAlert("No Selection", "To save Export Presets, select a layer that has all the export options you wish to include in the preset, then run the plugin again.");
		return;
	}

	var exportOptions = layer.exportOptions().exportFormats();
	if (exportOptions.count() == 0) {
		showAlert("No Export Options Defined", "To save Export Presets, select a layer that has all the export options you wish to include in the preset, then run the plugin again.");
		return;
	}

	var settingsWindow = getAlertWindow();
	settingsWindow.addButtonWithTitle("Save Preset");
	settingsWindow.addButtonWithTitle("Cancel");

	settingsWindow.setMessageText(context.command.name());
	settingsWindow.setInformativeText("Save the export options from the selected layer as a preset for future use.");

	settingsWindow.addTextLabelWithValue("Preset Name:");
	var presetNameField = NSTextField.alloc().initWithFrame(NSMakeRect(0,0,300,23));
	presetNameField.setPlaceholderString("For iOS, For Android, etc.")
	settingsWindow.addAccessoryView(presetNameField);

	settingsWindow.addTextLabelWithValue("Shortcut:");
	var shortcutField = NSTextField.alloc().initWithFrame(NSMakeRect(0,0,300,23));
	shortcutField.setPlaceholderString("Ex: cmd shift y");
	settingsWindow.addAccessoryView(shortcutField);

	presetNameField.setNextKeyView(shortcutField);
	settingsWindow.alert().window().setInitialFirstResponder(presetNameField);

	var response = settingsWindow.runModal();
	if (response == "1000") {

		var manifestPath = context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent("manifest.json").path(),
			manifest = getJSON(manifestPath, true),
			commands = manifest.commands,
			commandsCount = commands.count(),
			presetName = presetNameField.stringValue(),
			presetShortcut = shortcutField.stringValue(),
			presetID = NSUUID.UUID().UUIDString(),
			presetExists = false,
			absoluteSize = layer.absoluteInfluenceRect().size,
			existingPresetIndex, existingPresetID,
			command;

		for (var i = 0; i < commandsCount; i++) {
			command = commands[i];
			if (command.name == presetName) {
				presetExists = true;
				existingPresetIndex = i;
				existingPresetID = command.identifier;
				break;
			}
		}

		if (presetExists) {
			var overwriteResponse = showAlert("A preset named '" + presetName + "' already exists.", "Would you like to overwrite it?", "Cancel", "Overwrite");
			if (overwriteResponse != "1001") {
				return;
			}

			manifest.commands.splice(existingPresetIndex, 1);
			manifest.menu.items.removeObject(existingPresetID);
		}

		var newCommand = {
			script : "script.js",
			handler : "applyPreset",
			name : presetName,
			identifier : presetID,
			shortcut : presetShortcut
		}
		manifest.commands.push(newCommand);
		manifest.menu.items.splice(-4, 0, presetID);

		var savedConfig = NSUserDefaults.standardUserDefaults().objectForKey(kSavedPresetsKey),
			optionsCount = exportOptions.count(),
			config = { presets : {} }, 
			newPreset = { presetName : presetName, shortcut : presetShortcut, exportFormats : [] },
			formatObj, formatOption, visualScaleType, actualSize, actualScale;

		if (savedConfig) {
			for (var pID in savedConfig.presets) {
				config.presets[pID] = savedConfig.presets[pID];
			}
		}

		if (presetExists) {
			delete config.presets[existingPresetID];
		}

		for (var i = 0; i < optionsCount; i++) {
			formatOption = exportOptions.objectAtIndex(i);
			visualScaleType = formatOption.visibleScaleType();
			actualScale = formatOption.scale();
			actualSize = visualScaleType == 1 ? Math.round(absoluteSize.width*actualScale) : visualScaleType == 2 ? Math.round(absoluteSize.height*actualScale) : 1;
			formatObj = {
				scale : actualScale,
				size : actualSize,
				name : formatOption.name(),
				fileFormat : formatOption.fileFormat(),
				visibleScaleType : visualScaleType
			}
			newPreset.exportFormats.push(formatObj);
		}
		config.presets[presetID] = newPreset;

		NSUserDefaults.standardUserDefaults().setObject_forKey(config, kSavedPresetsKey);
		saveJSON(manifest, manifestPath);

		AppController.sharedInstance().pluginManager().reloadPlugins();
		context.document.showMessage(presetName + " : Preset Saved.");

	}
}

var restorePresets = function(context) {
	parseContext(context);
	var savedConfig = NSUserDefaults.standardUserDefaults().objectForKey(kSavedPresetsKey);

	if (!savedConfig) {
		showAlert("No presets found.", "Use this command only after you've updated to a new version of the plugin and your saved presets no longer show up.");
		return;
	}

	var manifestPath = context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent("manifest.json").path(),
		manifest = getJSON(manifestPath, true),
		commands = manifest.commands,
		presets = savedConfig.presets,
		numPresets = 0,
		preset, newCommand;

	for (var pID in presets) {
		numPresets++;
		if (manifest.menu.items.containsObject(pID)) {
			continue;
		}
		preset = presets[pID];
		newCommand = {
			script : "script.js",
			handler : "applyPreset",
			name : preset.presetName,
			identifier : pID,
			shortcut : preset.shortcut
		}
		manifest.commands.push(newCommand);
		manifest.menu.items.splice(-4, 0, pID);
	}
	saveJSON(manifest, manifestPath);

	AppController.sharedInstance().pluginManager().reloadPlugins();
	context.document.showMessage(numPresets + " Preset" + (numPresets == 1 ? "" : "s") + " Restored");
}

var deletePresets = function(context) {

	parseContext(context);

	var savedConfig = NSUserDefaults.standardUserDefaults().objectForKey(kSavedPresetsKey);

	if (!savedConfig || savedConfig.presets.count() == 0) {
		showAlert("No presets found.", "There are no presets to delete.");
		return;
	}

	var manifestPath = context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent("manifest.json").path(),
		manifest = getJSON(manifestPath, true),
		predicate = NSPredicate.predicateWithFormat("handler == 'applyPreset'"),
		commands = manifest.commands.filteredArrayUsingPredicate(predicate),
		commandsCount = commands.count(),
		settingsWindow = getAlertWindow(),
		command, checkbox;

	settingsWindow.addButtonWithTitle("Delete");
	settingsWindow.addButtonWithTitle("Cancel");

	settingsWindow.setMessageText(context.command.name());
	settingsWindow.setInformativeText("Select the presets you wish to delete. This cannot be undone, so please be sure.");

	for (var i = 0; i < commandsCount; i++) {
		command = commands[i];
		checkbox = NSButton.alloc().initWithFrame(NSMakeRect(0,0,300, 23));
		checkbox.setState(NSOffState);
		checkbox.setButtonType(NSSwitchButton);
  		checkbox.setBezelStyle(0);
		checkbox.setTitle(command.name);
		settingsWindow.addAccessoryView(checkbox);
	}

	var response = settingsWindow.runModal();
	if (response == "1000") {

		var config = { presets : {} },
			numDeleted = 0,
			commandIndex;

		if (savedConfig) {
			for (var pID in savedConfig.presets) {
				config.presets[pID] = savedConfig.presets[pID];
			}
		}

		for (var i = 0; i < commandsCount; i++) {
			checkbox = settingsWindow.viewAtIndex(i);
			if (checkbox.state() == NSOnState) {
				command = commands[i];
				commandIndex = manifest.commands.indexOfObject(command);
				manifest.commands.splice(commandIndex, 1);
				manifest.menu.items.removeObject(command.identifier);

				delete config.presets[command.identifier];
				numDeleted++;
			}
		}

		NSUserDefaults.standardUserDefaults().setObject_forKey(config, kSavedPresetsKey);
		saveJSON(manifest, manifestPath);

		AppController.sharedInstance().pluginManager().reloadPlugins();
		context.document.showMessage(numDeleted + " Preset" + (numDeleted == 1 ? "" : "s") + " Deleted.");
	}
}

var applyPreset = function(context) {
	
	parseContext(context);

	var selection = context.selection;
	if (selection.count() == 0) {
		showAlert("No Selection", "Select one or more layers to make exportable.");
		return;
	}

	var loop = selection.objectEnumerator(),
		presets = NSUserDefaults.standardUserDefaults().objectForKey(kSavedPresetsKey).presets,
		presetID = context.command.identifier(),
		selectedPreset = presets[presetID].exportFormats,
		presetOptionsCount = selectedPreset.count(),
		formatOptions,
		formatOption, presetOption, exportOptions, layer, absoluteSize, actualScale;


	context.document.currentPage().deselectAllLayers();

	while (layer = loop.nextObject()) {
		exportOptions = layer.exportOptions();
		exportOptions.removeAllExportFormats();

		absoluteSize = layer.absoluteInfluenceRect().size;
		formatOptions = [];
		for (var i = 0; i < presetOptionsCount; i++) {
			presetOption = selectedPreset[i];

			actualScale = presetOption.visibleScaleType == 1 ? presetOption.size/absoluteSize.width : presetOption.visibleScaleType == 2 ? presetOption.size/absoluteSize.height : presetOption.scale;
			formatOption = MSExportFormat.formatWithScale_name_fileFormat(actualScale, presetOption.name, presetOption.fileFormat);

			formatOption.setVisibleScaleType(presetOption.visibleScaleType);
			formatOptions.push(formatOption);
		}

		exportOptions.addExportFormats(formatOptions);
		layer.select_byExpandingSelection(true, true);
	}
}

var importPresets = function(context) {

	parseContext(context);

	var openPanel = NSOpenPanel.openPanel();
	openPanel.setCanChooseDirectories(false);
	openPanel.setAllowsMultipleSelection(true);
	openPanel.setMessage("Select a .sketchexportpreset file.");
	openPanel.setAllowedFileTypes(["sketchexportpreset"]);

	var response = openPanel.runModal();
	if (response == 1) {

		var URLs = openPanel.URLs(),
			URLsCount = URLs.count(),
			savedConfig = NSUserDefaults.standardUserDefaults().objectForKey(kSavedPresetsKey),
			manifestPath = context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent("manifest.json").path(),
			manifest = getJSON(manifestPath, true),
			commands = manifest.commands,
			commandsCount = commands.count(),
			existingPresetNames = [],
			presetsToOverwrite = [],
			presetsCount = 0,
			config = { presets : {} }, 
			importedPresets, command, newCommand;

		if (savedConfig) {
			for (var pID in savedConfig.presets) {
				config.presets[pID] = savedConfig.presets[pID];
			}
		}

		for (var i = 0; i < commandsCount; i++) {
			command = commands[i];
			existingPresetNames.push(command.name);
		}

		for (var i = 0; i < URLsCount; i++) {
			importedPresets = getJSON(URLs[i].path(), false).presets;

			for (var pID in importedPresets) {
				if (manifest.menu.items.containsObject(pID)) {
					continue;
				}
				preset = importedPresets[pID];
				if (existingPresetNames.indexOf(preset.presetName) != -1) {
					presetsToOverwrite.push(preset);
					continue;
				}

				newCommand = {
					script : "script.js",
					handler : "applyPreset",
					name : preset.presetName,
					identifier : pID,
					shortcut : preset.shortcut
				}

				config.presets[pID] = preset;

				manifest.commands.push(newCommand);
				manifest.menu.items.splice(-4, 0, pID);

				presetsCount++;
			}
		}

		var overwriteCount = presetsToOverwrite.length;
		if (overwriteCount) {
			var overwriteResponse = showAlert(overwriteCount + " presets already exists.", "Would you like to overwrite them?", "Skip", "Overwrite");
			if (overwriteResponse == "1000") {				

				for (var i = 0; i < overwriteCount; i++) {
					preset = presetsToOverwrite[i];

					newCommand = {
						script : "script.js",
						handler : "applyPreset",
						name : preset.presetName,
						identifier : pID,
						shortcut : preset.shortcut
					}

					config.presets[pID] = preset;

					manifest.commands.push(newCommand);
					manifest.menu.items.splice(-4, 0, pID);

					presetsCount++;
				}

			}
		}

		NSUserDefaults.standardUserDefaults().setObject_forKey(config, kSavedPresetsKey);
		saveJSON(manifest, manifestPath);

		AppController.sharedInstance().pluginManager().reloadPlugins();
		context.document.showMessage(presetsCount + " Preset" + (presetsCount == 1 ? "" : "s") + " Imported.");

	}
}

var exportPresets = function(context) {

	parseContext(context);

	var savedConfig = NSUserDefaults.standardUserDefaults().objectForKey(kSavedPresetsKey);

	if (!savedConfig || savedConfig.presets.count() == 0) {
		showAlert("No presets found.", "Define your presets first, then export them to share with your team or to import them on another Mac.");
		return;
	}

	var savePanel = NSSavePanel.savePanel();
	savePanel.setExtensionHidden(false);
	savePanel.setAllowedFileTypes(["sketchexportpreset"]);
	savePanel.setNameFieldStringValue("Export Format Presets");

	var response = savePanel.runModal();
	if (response == 1) {
		var filePath = savePanel.URL().path();
		saveJSON(savedConfig, filePath);

		NSWorkspace.sharedWorkspace().selectFile_inFileViewerRootedAtPath(filePath, filePath.stringByDeletingLastPathComponent());
	}
}

var clearFormats = function(context) {

	var selection = context.selection,
		loop = selection.objectEnumerator(),
		layer;

	context.document.currentPage().deselectAllLayers();

	while (layer = loop.nextObject()) {
		layer.exportOptions().removeAllExportFormats();
		layer.select_byExpandingSelection(true, true);
	}
}

var showAlert = function(message, info, primaryButtonText, secondaryButtonText) {
	var alert = getAlertWindow();
	alert.setMessageText(message);
	alert.setInformativeText(info);
	if (typeof primaryButtonText !== 'undefined') {
		alert.addButtonWithTitle(primaryButtonText);
	}
	if (typeof secondaryButtonText !== 'undefined') {
		alert.addButtonWithTitle(secondaryButtonText);
	}
	return alert.runModal();
}

var getJSON = function(filePath, mutable) {
	var data = NSData.dataWithContentsOfFile(filePath),
		options = mutable == true ? NSJSONReadingMutableContainers : 0;
	return NSJSONSerialization.JSONObjectWithData_options_error(data, options, nil);
}

var saveJSON = function(obj, filePath) {
	var data = NSJSONSerialization.dataWithJSONObject_options_error(obj, NSJSONWritingPrettyPrinted, nil),
		dataAsString = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding);
	return dataAsString.writeToFile_atomically_encoding_error(filePath, true, NSUTF8StringEncoding, nil);
}

var parseContext = function(context) {
	iconImage = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path());
}

var getAlertWindow = function() {
	var alert = COSAlertWindow.new();
	if (iconImage) {
		alert.setIcon(iconImage);
	}
	return alert;
}