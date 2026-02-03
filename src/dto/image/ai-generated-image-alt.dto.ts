export interface AIGeneratedImageAltDto {
  imageId: string;
  oldAlt: string;
  newAlt: string;
  variants: {
    id: string;
    title: string;
  }[];
}
