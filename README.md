#Make Exportable
Export option presets for Sketch layers.  
<img src="http://abynim.com/plugins/sketch-exportable/icon.png?raw=true" alt="Icon" width="128px" height=" 128px"/>

##Install the plugin
[Download](https://github.com/abynim/sketch-exportable/archive/master.zip) and extract the contents of this repository. Then double-click the `MakeExportable.sketchplugin` bundle to install the plugin.

---

##Usage
When you first install the plugin it will contain no presets. You must set it up with the presets that you need, based on the scale you design at and the devices for which you wish to export assets.

###Create a New Preset
Select a layer and manually make it exportable in the Inspector. Add all the formats, sizes and suffixes you need.  

<img src="http://abynim.com/plugins/sketch-exportable/new-preset-formats.png?raw=true" alt="New Preset Formats" width="212px" height="167px"/>

With the same layer selected, run the `Make Exportable` > `Configure` > `New Preset` plugin command.  

<img src="http://abynim.com/plugins/sketch-exportable/new-preset.png?raw=true" alt="New Preset Menu" width="708px" height=" 221px"/>

Give the preset a name. Optionally also set a shortcut. Shortcuts are defined by using a combination of modifiers ( `cmd`, `control`, `shift`, `option`) and any other key. For example, `cmd shift y`. Remember to check if a shortcut is already being used by a different plugin or by Sketch itself.

<img src="http://abynim.com/plugins/sketch-exportable/new-preset-options.png?raw=true" alt="New Preset Options" width="535px" height="383px"/>

When you save the preset, you will see it as a menu item in the plugins menu. Next time you need to add these export settings to a layer, just select it and trigger the command.

<img src="http://abynim.com/plugins/sketch-exportable/new-preset-defined.png?raw=true" alt="New Preset Defined" width="574px" height="151px"/>


###Other Configuration Options

<img src="http://abynim.com/plugins/sketch-exportable/config-options.png?raw=true" alt="Other Config Options" width="176px" height="161px"/>

1. **Import and Export** - To transfer your presets to another Mac or to share them with your team, you can `Export` them to a file. Then `Import` the file on the destination Mac. Easy-peasy.
2. **Restore Presets** - When you update the plugin with future versions, your presets will be removed from the plugin menu. Not to worry, they are saved independently. Run a `Restore` to see them in the plugins menu again.
3. **Delete Presets** - This lets you delete an existing preset from the menu. Duh!

###Remove Formats for Selection
Run this command to remove all export formats from one or more selected layers.

---

## Share
If this plugin saved you a few minutes of mundane work, do spend a second to <a href="https://twitter.com/intent/tweet?source=https%3A%2F%2Fgithub.com%2Fabynim%2Fsketch-exportable&text=A%20Sketch%20plugin%20to%20create%20and%20share%20export%20option%20presets%3A%20https%3A%2F%2Fgithub.com%2Fabynim%2Fsketch-exportable&via=abynim" target="_blank" title="Tweet">Tweet about it</a> or <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fgithub.com%2Fabynim%2Fsketch-exportable&t=A%20Sketch%20plugin%20to%20create%20and%20share%20export%20option%20presets" target="_blank" title="Share on Facebook">share it on Facebook</a>.
