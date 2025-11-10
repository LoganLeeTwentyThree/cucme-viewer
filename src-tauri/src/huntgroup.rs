use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct HuntGroup{
    pub id: i8,
    pub final_ext: i16,
    pub list: String,
    pub pilot: i16,
    pub name: String,
}