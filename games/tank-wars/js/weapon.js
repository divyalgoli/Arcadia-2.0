/**
 * Weapon System Definitions and Configurations for Tank Wars.
 * Defines 5 distinct weapon types with unique stats, mechanics, and fire patterns.
 */
class WeaponSystem {
  static WEAPONS = {
    CANNON: {
      id: 'CANNON',
      name: 'Standard Cannon',
      icon: '💥',
      speed: 520,
      damage: 20,
      fireRate: 0.38,
      ammo: Infinity,
      description: 'Reliable, balanced tank cannon with unlimited ammo.'
    },
    MACHINE_GUN: {
      id: 'MACHINE_GUN',
      name: 'Machine Gun',
      icon: '🔫',
      speed: 680,
      damage: 8,
      fireRate: 0.09,
      ammo: 50,
      spread: 0.08,
      description: 'Rapid-fire tracer stream.'
    },
    ROCKET: {
      id: 'ROCKET',
      name: 'Rocket Launcher',
      icon: '🚀',
      speed: 440,
      damage: 38,
      fireRate: 0.65,
      ammo: 10,
      splashRadius: 65,
      description: 'Heavy explosive rocket with smoke trail & area blast.'
    },
    LASER: {
      id: 'LASER',
      name: 'Laser Cannon',
      icon: '⚡',
      speed: 1800,
      damage: 42,
      fireRate: 0.75,
      ammo: 8,
      pierce: true,
      description: 'High-energy beam ray penetrating crates.'
    },
    MINE: {
      id: 'MINE',
      name: 'Mine Layer',
      icon: '💣',
      speed: 0,
      damage: 50,
      fireRate: 0.50,
      ammo: 5,
      radius: 45,
      description: 'Deploys high-explosive proximity landmines.'
    }
  };

  static getWeaponConfig(weaponId) {
    return this.WEAPONS[weaponId] || this.WEAPONS.CANNON;
  }
}

window.WeaponSystem = WeaponSystem;
