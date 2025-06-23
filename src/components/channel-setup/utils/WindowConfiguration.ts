
export interface WindowConfig {
  width: number;
  height: number;
  left: number;
  top: number;
}

export class WindowConfiguration {
  static getPopupConfig(width: number = 600, height: number = 700): WindowConfig {
    const left = Math.max(0, Math.floor(window.screen.width / 2 - width / 2));
    const top = Math.max(0, Math.floor(window.screen.height / 2 - height / 2));
    
    return { width, height, left, top };
  }

  static buildWindowFeatures(config: WindowConfig): string {
    return `width=${config.width},height=${config.height},left=${config.left},top=${config.top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no,directories=no`;
  }
}
