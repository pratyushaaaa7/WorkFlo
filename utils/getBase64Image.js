// import * as FileSystem from "expo-file-system";
// import { Asset } from "expo-asset";

// // ✅ Converts a local image asset to Base64 for PDF HTML (works on Android + iOS + production)
// export async function getBase64ImageFromAsset(assetModule) {
//   try {
//     const asset = Asset.fromModule(assetModule);
//     await asset.downloadAsync(); // ensure it's available locally
//     const uri = asset.localUri || asset.uri; // fallback for iOS release builds
//     if (!uri) throw new Error("No valid URI found for asset");

//     const base64 = await FileSystem.readAsStringAsync(uri, {
//       encoding: FileSystem.EncodingType.Base64,
//     });
//     return `data:image/png;base64,${base64}`;
//   } catch (error) {
//     console.error("⚠️ Error converting image to Base64:", error);
//     // tiny transparent fallback so PDF never crashes
//     const transparentFallback =
//       "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
//     return transparentFallback;
//   }
// }
