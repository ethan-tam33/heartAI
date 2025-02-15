from typing import List
from pydantic import BaseModel

class MedicalRecord(BaseModel):
    Pat: int
    Age: int
    Category: str
    heart_embedding: List[float]  # Embedding size should match torch_embed_size
    Normal: bool
    MildModerateDilation: bool
    VSD: bool
    ASD: bool
    DORV: bool
    DLoopTGA: bool
    ArterialSwitch: bool
    BilateralSVC: bool
    SevereDilation: bool
    TortuousVessels: bool
    Dextrocardia: bool
    Mesocardia: bool
    InvertedVentricles: bool
    InvertedAtria: bool
    LeftCentralIVC: bool
    LeftCentralSVC: bool
    LLoopTGA: bool
    AtrialSwitch: bool
    Rastelli: bool
    SingleVentricle: bool
    DILV: bool
    DIDORV: bool
    CommonAtrium: bool
    Glenn: bool
    Fontan: bool
    Heterotaxy: bool
    SuperoinferiorVentricles: bool
    PAAtresiaOrMPAStump: bool
    PABanding: bool
    AOPAAnastamosis: bool
    Marfan: bool
    CMRArtifactAO: bool
    CMRArtifactPA: bool