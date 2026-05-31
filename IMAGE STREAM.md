---
cssclasses:
  - bfv-container
---

```datacorejsx
const activeFile = dc.resolvePath("IMAGE STREAM") || "_RESOURCES/DATACORE/_DONE/IMAGE STREAM/IMAGE STREAM";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath, dc });
```
