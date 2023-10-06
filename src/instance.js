const EXP_SCALE_MODES = {
  LINEAR: 0,
  PROGRESSIVE: 1,
  CUSTOM: 2
};

function getInstanceJs(parentClass, scriptInterface, addonTriggers, C3) {
  return class extends parentClass {
    constructor(inst, properties) {
      super(inst);

      this.baseExperince = properties[1];
      this.experienceScale = properties[2];
      this.maxLevel = properties[4];
      this.levelDowgrading = !! properties[5];
      this.experiecenScaleMode = properties[0];
      this.customExperienceScale = String(properties[3]).trim().split(",");
      this.currentLevel = 1;
      this.totalExperience = 0;
      this.levelExperience = 0;
      this.levelExperiencePool = this.GetLevelExpPool(1);
      this.levelChangeValue = 0;
    }

    AddExperience(experience) {
      debugger;
      if (this.maxLevel != -1 && this.currentLevel >= this.maxLevel) {
        return;
      }

      let levelChangeQuantity = 0;
      
      while(experience > 0) {
        const missingExperience = this.levelExperiencePool - this.levelExperience;
        if(missingExperience > experience) {
          this.levelExperience += experience;
          this.totalExperience += experience;
          experience = 0;
        } 
        else {
          this.totalExperience += missingExperience;
          experience -= missingExperience;
          ++levelChangeQuantity;
          ++this.currentLevel;
          this.levelExperience = 0;
          this.levelExperiencePool = this.GetLevelExpPool(this.currentLevel);
          this.Trigger(C3.Behaviors.piranha305_experience.Cnds.OnLevelUp);
          this.Trigger(C3.Behaviors.piranha305_experience.Cnds.OnLevelReached);

          if(this.currentLevel >= this.maxLevel) {
            break;
          }
        }
      }

      if(levelChangeQuantity > 0) {
        this.levelChangeValue = levelChangeQuantity;
        this.Trigger(C3.Behaviors.piranha305_experience.Cnds.OnLevelChange);
        this.levelChangeValue = 0;

        if(this.currentLevel === this.maxLevel){
          this.Trigger(C3.Behaviors.piranha305_experience.Cnds.OnMaxLevelReached);
        } 
      }

      this.Trigger(C3.Behaviors.piranha305_experience.Cnds.OnExperienceIncreased);
      this.Trigger(C3.Behaviors.piranha305_experience.Cnds.OnExperienceChanged); 
    }

    SubtractExperience(experience) {
      if (this.totalExperience < 1) {
        return
      }

      let levelChangeQuantity = 0;

      while(experience > 0 && this.totalExperience > 0) {
        if(this.levelExperience >= experience) {
          this.levelExperience -= experience;
          this.totalExperience -= experience;
          experience = 0;
        }
        else {
          experience -= this.levelExperience;
          this.totalExperience -= this.levelExperience;
          this.levelExperience = 0;

          if(this.levelDowgrading) {
            --levelChangeQuantity;
            --this.currentLevel;
            this.levelExperiencePool = this.GetLevelExpPool(this.currentLevel);
            this.levelExperience = this.levelExperiencePool;
            this.Trigger(C3.Behaviors.piranha305_experience.Cnds.OnLevelDown);
          }
          else {
            break;
          }
        }
      }

      if (levelChangeQuantity < 0){
        this.levelChangeValue = levelChangeQuantity;
        this.Trigger(C3.Behaviors.piranha305_experience.Cnds.OnLevelChange);
        this.levelChangeValue = 0;
      } 

      this.Trigger(C3.Behaviors.piranha305_experience.Cnds.OnExperienceDecreased);
      this.Trigger(C3.Behaviors.piranha305_experience.Cnds.OnExperienceChanged); 
    }

    SetExperience(experience) {
      if(experience > this.totalExperience) {
        this.AddExperience(experience - this.totalExperience);
      }
      else if (experience < this.totalExperience) {
        this.SubtractExperience(this.totalExperience - experience);
      }
    }

    SetExperienceScale(scale) {
      this.experienceScale = scale;
      this.levelExperiencePool = this.GetLevelExpPool(this.currentLevel);
    }

    SetMaxLevel(level) {
      this.maxLevel = level;
    }

    SetExperienceScaleMode(mode) {
      this.experiecenScaleMode = mode;
      this.levelExperiencePool = this.GetLevelExpPool(this.currentLevel);
    }

    GetLevelExpPool(level) {
      switch(this.experiecenScaleMode) {
        case EXP_SCALE_MODES.PROGRESSIVE:
          return Math.floor(this.baseExperince * Math.pow(this.experienceScale, level - 1));
        case EXP_SCALE_MODES.LINEAR:
          return Math.floor(this.baseExperince + (this.experienceScale * (level - 1)));
        case EXP_SCALE_MODES.CUSTOM:
          return Math.floor(this.customExperienceScale[level - 1] || this.customExperienceScale[this.customExperienceScale.length - 1]);
      }
    }

    OnLevelUp() {
      return true;
    }

    OnLevelDown(){
      return true
    }

    OnLevelReached(level) {
      return this.currentLevel === level;
    }

    OnMaxLevelReached() {
      return true;
    }

    OnExperienceIncreased() {
      return true;
    }

    OnExperienceDecreased() {
      return true;
    }

    OnExperienceChanged() { 
      return true;
    }

    OnLevelChange() {
      return true;
    }

    CompareLevel(cmp, level) {
      switch(cmp) {
        case 0:
          return this.currentLevel === level;
        case 1:
          return this.currentLevel !== level;
        case 2:
          return this.currentLevel < level;
        case 3:
          return this.currentLevel <= level;
        case 4:
          return this.currentLevel > level;
        case 5:
          return this.currentLevel >= level;
        default: 
          return false;
      }
    }

    CurrentLevel() {
      return this.currentLevel;
    }

    MaxLevel() {
      return this.maxLevel;
    }

    TotalExperience() {
      return this.totalExperience;
    }

    ExperienceToNextLevel() {
      return this.levelExperiencePool - this.levelExperience;
    }

    LevelExperience() {
      return this.levelExperience;
    }

    LevelExperiencePool() {
      return this.levelExperiencePool;
    }

    ProgressToNextLevel() {
      return Math.floor((this.levelExperience / this.levelExperiencePool) * 100) / 100;
    }

    AsJson() {
      return JSON.stringify(this.SaveToJson());
    }

    Release() {
      super.Release();
    }

    SaveToJson() {
      return {
        "currentLevel": this.currentLevel,
        "totalExperience": this.totalExperience,
        "levelExperience": this.levelExperience,
        "levelExperiencePool": this.levelExperiencePool,
        "levelChangeValue": this.levelChangeValue,
        "maxLevel": this.maxLevel,
        "experienceScale": this.experienceScale,
        "baseExperince": this.baseExperince,
        "experiecenScaleMode": this.experiecenScaleMode,
        "customExperienceScale": this.customExperienceScale,
        "levelDowgrading": this.levelDowgrading 
      };
    }

    LoadJson(jsonString) {
      this.LoadFromJson(JSON.parse(jsonString));
    }

    LoadFromJson(o) {
      this.currentLevel = o["currentLevel"];
      this.totalExperience = o["totalExperience"];
      this.levelExperience = o["levelExperience"];
      this.levelExperiencePool = o["levelExperiencePool"];
      this.levelChangeValue = o["levelChangeValue"];
      this.maxLevel = o["maxLevel"];
      this.experienceScale = o["experienceScale"];
      this.baseExperince = o["baseExperince"];
      this.experiecenScaleMode = o["experiecenScaleMode"];
      this.customExperienceScale = o["customExperienceScale"];
      this.levelDowgrading = o["levelDowgrading"];
    }

    Trigger(method) {
      super.Trigger(method);
      const addonTrigger = addonTriggers.find((x) => x.method === method);
      if (addonTrigger) {
        this.GetScriptInterface().dispatchEvent(new C3.Event(addonTrigger.id));
      }
    }

    GetScriptInterfaceClass() {
      return scriptInterface;
    }
  };
}
